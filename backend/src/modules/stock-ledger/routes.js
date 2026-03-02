'use strict';
const router = require('express').Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { query } = require('../../config/db');
const { paginated } = require('../../utils/response');
const { parsePagination } = require('../../utils/pagination');

router.use(authenticate);

router.get('/', async (req, res) => {
  const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query, ['transaction_date','created_at']);
  const conditions = ['sl.tenant_id = ?'];
  const params = [req.tenantId];
  if (req.query.productId)   { conditions.push('sl.product_id = ?');   params.push(req.query.productId); }
  if (req.query.warehouseId) { conditions.push('sl.warehouse_id = ?'); params.push(req.query.warehouseId); }
  if (req.query.type)        { conditions.push('sl.transaction_type = ?'); params.push(req.query.type); }
  if (req.query.from)        { conditions.push('sl.transaction_date >= ?'); params.push(req.query.from); }
  if (req.query.to)          { conditions.push('sl.transaction_date <= ?'); params.push(req.query.to); }
  const where = conditions.join(' AND ');
  const [rows, count] = await Promise.all([
    query(`SELECT sl.*, p.name AS product_name, p.code AS product_code, w.name AS warehouse_name
           FROM stock_ledger sl JOIN products p ON sl.product_id = p.id JOIN warehouses w ON sl.warehouse_id = w.id
           WHERE ${where} ORDER BY sl.${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`,
      params),
    query(`SELECT COUNT(*) AS total FROM stock_ledger sl WHERE ${where}`, params),
  ]);
  return paginated(res, rows, { page, limit, total: count[0].total }, 'Stock ledger');
});

module.exports = router;
