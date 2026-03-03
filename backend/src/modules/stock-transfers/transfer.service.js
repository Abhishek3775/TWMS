'use strict';

const { query } = require('../../config/db');
const { parsePagination, buildSearchClause } = require('../../utils/pagination');

const SELECT_COLUMNS = [
  'id', 'tenant_id', 'transfer_number', 'from_warehouse_id', 'to_warehouse_id',
  'status', 'transfer_date', 'received_date', 'vehicle_number', 'notes', 'created_by', 'created_at',
].join(', ');

const ALLOWED_SORT_FIELDS = ['transfer_number', 'transfer_date', 'created_at'];

const createTransfer = async (data) => {
  const sql = `
    INSERT INTO stock_transfers (
      id, tenant_id, transfer_number, from_warehouse_id, to_warehouse_id,
      status, transfer_date, received_date, vehicle_number, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await query(sql, [
    data.id,
    data.tenant_id,
    data.transfer_number,
    data.from_warehouse_id,
    data.to_warehouse_id,
    data.status || 'draft',
    data.transfer_date,
    data.received_date ?? null,
    data.vehicle_number ?? null,
    data.notes ?? null,
    data.created_by,
  ]);
};

const getAllTransfers = async (tenantId, options = {}) => {
  const { page, limit, offset, sortBy, sortOrder, search } = parsePagination(options, ALLOWED_SORT_FIELDS);
  const conditions = ['tenant_id = ?'];
  const params = [tenantId];
  const { clause: searchClause, params: searchParams } = buildSearchClause(search, ['transfer_number']);
  if (searchClause) {
    conditions.push(searchClause);
    params.push(...searchParams);
  }
  const orderBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
  const whereSql = conditions.join(' AND ');
  const baseSql = `SELECT ${SELECT_COLUMNS} FROM stock_transfers WHERE ${whereSql}`;
  // LIMIT/OFFSET interpolated (validated integers) — MySQL 8.0.22+ rejects them as bound params
  const [rows, countResult] = await Promise.all([
    query(`${baseSql} ORDER BY ${orderBy} ${order} LIMIT ${limit} OFFSET ${offset}`, params),
    query(`SELECT COUNT(*) AS total FROM stock_transfers WHERE ${whereSql}`, params),
  ]);
  const total = countResult[0]?.total ?? 0;
  return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getTransferById = async (id, tenantId) => {
  const rows = await query(
    `SELECT ${SELECT_COLUMNS} FROM stock_transfers WHERE id = ? AND tenant_id = ?`,
    [id, tenantId]
  );
  return rows[0] ?? null;
};

const updateTransfer = async (id, tenantId, fields) => {
  const allowed = [
    'transfer_number', 'from_warehouse_id', 'to_warehouse_id', 'status',
    'transfer_date', 'received_date', 'vehicle_number', 'notes',
  ];
  const setParts = [];
  const values = [];
  for (const key of allowed) {
    if (fields[key] === undefined) continue;
    setParts.push(`${key} = ?`);
    values.push(fields[key] === null ? null : fields[key]);
  }
  if (setParts.length === 0) return null;
  const result = await query(
    `UPDATE stock_transfers SET ${setParts.join(', ')} WHERE id = ? AND tenant_id = ?`,
    [...values, id, tenantId]
  );
  if (result.affectedRows === 0) return null;
  return getTransferById(id, tenantId);
};

const deleteTransfer = async (id, tenantId) => {
  const result = await query(
    'DELETE FROM stock_transfers WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return result.affectedRows > 0;
};

module.exports = {
  createTransfer,
  getAllTransfers,
  getTransferById,
  updateTransfer,
  deleteTransfer,
};
