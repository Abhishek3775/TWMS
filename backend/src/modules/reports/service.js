'use strict';
const { query } = require('../../config/db');

/**
 * GSTR-1 style GST report — invoice-wise tax summary
 */
const getGSTReport = async (tenantId, { month, year }) => {
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();

  const invoices = await query(
    `SELECT i.invoice_number, i.invoice_date, c.name AS customer_name,
            c.gstin AS customer_gstin, i.sub_total, i.cgst_amount, i.sgst_amount,
            i.igst_amount, i.grand_total
     FROM invoices i JOIN customers c ON i.customer_id = c.id
     WHERE i.tenant_id = ? AND i.status = 'issued'
       AND MONTH(i.invoice_date) = ? AND YEAR(i.invoice_date) = ?
     ORDER BY i.invoice_date`,
    [tenantId, m, y]
  );

  const hsn = await query(
    `SELECT ii.hsn_code, p.name AS product_name,
            SUM(ii.quantity_boxes) AS total_boxes,
            SUM(ii.taxable_amount) AS taxable_amount,
            SUM(ii.cgst_amount) AS cgst_amount,
            SUM(ii.sgst_amount) AS sgst_amount,
            SUM(ii.igst_amount) AS igst_amount
     FROM invoice_items ii
     JOIN invoices i ON ii.invoice_id = i.id
     JOIN products p ON ii.product_id = p.id
     WHERE ii.tenant_id = ? AND i.status = 'issued'
       AND MONTH(i.invoice_date) = ? AND YEAR(i.invoice_date) = ?
     GROUP BY ii.hsn_code, p.name`,
    [tenantId, m, y]
  );

  const summary = invoices.reduce((acc, inv) => ({
    totalInvoices: acc.totalInvoices + 1,
    taxableAmount: acc.taxableAmount + parseFloat(inv.sub_total),
    cgst: acc.cgst + parseFloat(inv.cgst_amount),
    sgst: acc.sgst + parseFloat(inv.sgst_amount),
    igst: acc.igst + parseFloat(inv.igst_amount),
    grandTotal: acc.grandTotal + parseFloat(inv.grand_total),
  }), { totalInvoices: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, grandTotal: 0 });

  return { period: `${y}-${String(m).padStart(2, '0')}`, summary, invoices, hsnSummary: hsn };
};

/**
 * Revenue report — last N months trend
 */
const getRevenueReport = async (tenantId, { months = 12 } = {}) => {
  const monthly = await query(
    `SELECT DATE_FORMAT(invoice_date, '%Y-%m') AS month,
            COUNT(*) AS invoice_count,
            SUM(grand_total) AS revenue,
            SUM(cgst_amount + sgst_amount + igst_amount) AS tax_collected
     FROM invoices
     WHERE tenant_id = ? AND status = 'issued'
       AND invoice_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
     GROUP BY DATE_FORMAT(invoice_date, '%Y-%m')
     ORDER BY month ASC`,
    [tenantId, months]
  );

  const topProducts = await query(
    `SELECT p.name, p.code, SUM(ii.quantity_boxes) AS boxes_sold, SUM(ii.line_total) AS revenue
     FROM invoice_items ii JOIN products p ON ii.product_id = p.id JOIN invoices i ON ii.invoice_id = i.id
     WHERE ii.tenant_id = ? AND i.status = 'issued'
       AND i.invoice_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
     GROUP BY p.id, p.name, p.code ORDER BY revenue DESC LIMIT 10`,
    [tenantId, months]
  );

  const topCustomers = await query(
    `SELECT c.name, c.code, SUM(i.grand_total) AS total_revenue, COUNT(*) AS invoice_count
     FROM invoices i JOIN customers c ON i.customer_id = c.id
     WHERE i.tenant_id = ? AND i.status = 'issued'
       AND i.invoice_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
     GROUP BY c.id, c.name, c.code ORDER BY total_revenue DESC LIMIT 10`,
    [tenantId, months]
  );

  return { monthly, topProducts, topCustomers };
};

/**
 * Accounts receivable aging report
 */
const getAgingReport = async (tenantId) => {
  const invoices = await query(
    `SELECT i.invoice_number, i.invoice_date, i.due_date, i.grand_total,
            i.payment_status, c.name AS customer_name, c.phone AS customer_phone,
            DATEDIFF(CURDATE(), i.due_date) AS days_overdue,
            (i.grand_total - COALESCE(paid.total_paid, 0)) AS outstanding
     FROM invoices i
     JOIN customers c ON i.customer_id = c.id
     LEFT JOIN (
       SELECT invoice_id, SUM(amount) AS total_paid
       FROM customer_payments WHERE tenant_id = ? AND status = 'cleared'
       GROUP BY invoice_id
     ) paid ON paid.invoice_id = i.id
     WHERE i.tenant_id = ? AND i.status = 'issued' AND i.payment_status != 'paid'
     ORDER BY days_overdue DESC`,
    [tenantId, tenantId]
  );

  const buckets = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0 };
  const customerBuckets = {};

  for (const inv of invoices) {
    const outstanding = parseFloat(inv.outstanding || 0);
    const days = parseInt(inv.days_overdue || 0);

    if (days <= 0)       buckets.current   += outstanding;
    else if (days <= 30) buckets.days1_30   += outstanding;
    else if (days <= 60) buckets.days31_60  += outstanding;
    else if (days <= 90) buckets.days61_90  += outstanding;
    else                 buckets.days90plus += outstanding;

    const cname = inv.customer_name;
    if (!customerBuckets[cname]) {
      customerBuckets[cname] = { customer: cname, phone: inv.customer_phone, current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 0 };
    }
    customerBuckets[cname].total += outstanding;
    if (days <= 0)       customerBuckets[cname].current   += outstanding;
    else if (days <= 30) customerBuckets[cname].days1_30   += outstanding;
    else if (days <= 60) customerBuckets[cname].days31_60  += outstanding;
    else if (days <= 90) customerBuckets[cname].days61_90  += outstanding;
    else                 customerBuckets[cname].days90plus += outstanding;
  }

  return {
    summary: buckets,
    totalOutstanding: Object.values(buckets).reduce((a, b) => a + b, 0),
    customerWise: Object.values(customerBuckets).sort((a, b) => b.total - a.total),
    invoices,
  };
};

/**
 * Stock valuation report
 */
const getStockValuation = async (tenantId, warehouseId) => {
  const conditions = ['ss.tenant_id = ?'];
  const params = [tenantId];
  if (warehouseId) { conditions.push('ss.warehouse_id = ?'); params.push(warehouseId); }

  return query(
    `SELECT p.name AS product_name, p.code, p.size_label, p.hsn_code,
            w.name AS warehouse_name, ss.total_boxes, ss.total_sqft,
            ss.avg_cost_per_box,
            (ss.total_boxes * COALESCE(ss.avg_cost_per_box, 0)) AS total_value
     FROM stock_summary ss
     JOIN products p ON ss.product_id = p.id
     JOIN warehouses w ON ss.warehouse_id = w.id
     WHERE ${conditions.join(' AND ')} AND ss.total_boxes > 0
     ORDER BY total_value DESC`,
    params
  );
};

/**
 * Dashboard KPIs — all in one parallel query
 */
const getDashboardKPIs = async (tenantId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todaySales, pendingOrders, lowStock, grnPending, monthRevenue, unpaidInvoices] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(grand_total), 0) AS total FROM sales_orders
       WHERE tenant_id = ? AND order_date >= ? AND order_date < ? AND status NOT IN ('cancelled','draft')`,
      [tenantId, today, tomorrow]
    ),
    query(`SELECT COUNT(*) AS total FROM sales_orders WHERE tenant_id = ? AND status IN ('draft','confirmed','pick_ready')`, [tenantId]),
    query(
      `SELECT COUNT(*) AS total FROM stock_summary ss JOIN products p ON ss.product_id = p.id
       WHERE ss.tenant_id = ? AND ss.total_boxes <= p.reorder_level_boxes AND ss.total_boxes >= 0`,
      [tenantId]
    ),
    query(`SELECT COUNT(*) AS total FROM grn WHERE tenant_id = ? AND status = 'draft'`, [tenantId]),
    query(
      `SELECT COALESCE(SUM(grand_total), 0) AS total FROM invoices
       WHERE tenant_id = ? AND status != 'cancelled' AND YEAR(invoice_date) = YEAR(CURDATE()) AND MONTH(invoice_date) = MONTH(CURDATE())`,
      [tenantId]
    ),
    query(
      `SELECT COALESCE(SUM(grand_total - COALESCE(p.paid, 0)), 0) AS total
       FROM invoices i
       LEFT JOIN (SELECT invoice_id, SUM(amount) AS paid FROM customer_payments WHERE tenant_id = ? AND status='cleared' GROUP BY invoice_id) p ON p.invoice_id = i.id
       WHERE i.tenant_id = ? AND i.status = 'issued' AND i.payment_status != 'paid'`,
      [tenantId, tenantId]
    ),
  ]);

  return {
    todaySales: todaySales[0].total,
    pendingOrders: pendingOrders[0].total,
    lowStockItems: lowStock[0].total,
    grnPending: grnPending[0].total,
    monthRevenue: monthRevenue[0].total,
    unpaidInvoices: unpaidInvoices[0].total,
  };
};

module.exports = { getGSTReport, getRevenueReport, getAgingReport, getStockValuation, getDashboardKPIs };
