'use strict';
const { query, beginTransaction } = require('../../config/db');
const { generateDocNumber } = require('../../utils/docNumber');
const { parsePagination } = require('../../utils/pagination');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../../middlewares/error.middleware');

const getAll = async (tenantId, queryParams) => {
  const { page, limit, offset, sortBy, sortOrder, search } = parsePagination(queryParams, ['order_date', 'created_at', 'so_number']);
  const conditions = ['so.tenant_id = ?'];
  const params = [tenantId];
  if (queryParams.status)    { conditions.push('so.status = ?'); params.push(queryParams.status); }
  if (queryParams.customerId){ conditions.push('so.customer_id = ?'); params.push(queryParams.customerId); }
  if (queryParams.paymentStatus) { conditions.push('so.payment_status = ?'); params.push(queryParams.paymentStatus); }
  if (search) { conditions.push('(so.so_number LIKE ? OR c.name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

  const where = conditions.join(' AND ');
  const [rows, count] = await Promise.all([
    query(`SELECT so.*, c.name AS customer_name, w.name AS warehouse_name
           FROM sales_orders so JOIN customers c ON so.customer_id = c.id JOIN warehouses w ON so.warehouse_id = w.id
           WHERE ${where} ORDER BY so.${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`,
      params),
    query(`SELECT COUNT(*) AS total FROM sales_orders so JOIN customers c ON so.customer_id = c.id WHERE ${where}`, params),
  ]);
  return { rows, total: count[0].total };
};

const getById = async (id, tenantId) => {
  const rows = await query(
    `SELECT so.*, c.name AS customer_name, w.name AS warehouse_name
     FROM sales_orders so JOIN customers c ON so.customer_id = c.id JOIN warehouses w ON so.warehouse_id = w.id
     WHERE so.id = ? AND so.tenant_id = ?`,
    [id, tenantId]
  );
  if (!rows.length) throw new AppError('Sales order not found', 404, 'NOT_FOUND');
  const items = await query(
    `SELECT soi.*, p.name AS product_name, p.code AS product_code, s.shade_code
     FROM sales_order_items soi JOIN products p ON soi.product_id = p.id LEFT JOIN shades s ON soi.shade_id = s.id
     WHERE soi.sales_order_id = ? AND soi.tenant_id = ?`,
    [id, tenantId]
  );
  return { ...rows[0], items };
};

const create = async (tenantId, userId, data) => {
  const soNumber = await generateDocNumber(tenantId, 'SO', 'SO');
  const id = uuidv4();
  const trx = await beginTransaction();
  try {
    await trx.query(
      `INSERT INTO sales_orders
         (id, tenant_id, so_number, customer_id, warehouse_id, status, order_date,
          expected_delivery_date, delivery_address, sub_total, discount_amount, tax_amount,
          grand_total, payment_status, notes, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())`,
      [id, tenantId, soNumber, data.customerId, data.warehouseId,
       data.orderDate || new Date(), data.expectedDeliveryDate || null,
       data.deliveryAddress || null, data.subTotal || 0, data.discountAmount || 0,
       data.taxAmount || 0, data.grandTotal || 0, data.notes || null, userId]
    );

    for (const item of data.items) {
      await trx.query(
        `INSERT INTO sales_order_items
           (id, tenant_id, sales_order_id, product_id, shade_id, batch_id,
            ordered_boxes, ordered_pieces, dispatched_boxes, unit_price, discount_pct, tax_pct, line_total)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        [tenantId, id, item.productId, item.shadeId || null, item.batchId || null,
         item.orderedBoxes, item.orderedPieces || 0, item.unitPrice,
         item.discountPct || 0, item.taxPct || 0, item.lineTotal || 0]
      );
    }
    await trx.commit();
    return getById(id, tenantId);
  } catch (err) {
    await trx.rollback();
    throw err;
  } finally {
    trx.release();
  }
};

/**
 * Confirm SO → auto-creates a PickList
 */
const confirmOrder = async (id, tenantId, userId) => {
  const so = await getById(id, tenantId);
  if (so.status !== 'draft') throw new AppError('Only draft orders can be confirmed', 400, 'INVALID_STATUS');

  const pickNumber = await generateDocNumber(tenantId, 'PICK', 'PICK');
  const pickId = uuidv4();
  const trx = await beginTransaction();
  try {
    await trx.query(`UPDATE sales_orders SET status = 'confirmed', updated_at = NOW() WHERE id = ? AND tenant_id = ?`, [id, tenantId]);

    await trx.query(
      `INSERT INTO pick_lists (id, tenant_id, sales_order_id, pick_number, warehouse_id, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [pickId, tenantId, id, pickNumber, so.warehouse_id, userId]
    );

    for (const item of so.items) {
      await trx.query(
        `INSERT INTO pick_list_items
           (id, tenant_id, pick_list_id, sales_order_item_id, product_id, shade_id, batch_id,
            requested_boxes, picked_boxes, status)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 0, 'pending')`,
        [tenantId, pickId, item.id, item.product_id, item.shade_id, item.batch_id, item.ordered_boxes]
      );
    }

    await trx.query(`UPDATE sales_orders SET status = 'pick_ready', updated_at = NOW() WHERE id = ? AND tenant_id = ?`, [id, tenantId]);
    await trx.commit();
    return getById(id, tenantId);
  } catch (err) {
    await trx.rollback();
    throw err;
  } finally {
    trx.release();
  }
};

module.exports = { getAll, getById, create, confirmOrder };
