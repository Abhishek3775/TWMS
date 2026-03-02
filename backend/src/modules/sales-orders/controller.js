'use strict';
const service = require('./service');
const { success, created, paginated } = require('../../utils/response');
const { writeAuditLog, extractRequestMeta } = require('../../utils/auditLog');

const getAll = async (req, res) => {
  const { rows, total } = await service.getAll(req.tenantId, req.query);
  return paginated(res, rows, { page: req.query.page || 1, limit: req.query.limit || 25, total });
};

const getById = async (req, res) => {
  const so = await service.getById(req.params.id, req.tenantId);
  return success(res, so, 'Sales order fetched');
};

const create = async (req, res) => {
  const so = await service.create(req.tenantId, req.user.id, req.body);
  const meta = extractRequestMeta(req);
  await writeAuditLog({ tenantId: req.tenantId, userId: req.user.id, action: 'CREATE', tableName: 'sales_orders', recordId: so.id, newValues: req.body, ...meta });
  return created(res, so, 'Sales order created');
};

const confirmOrder = async (req, res) => {
  const so = await service.confirmOrder(req.params.id, req.tenantId, req.user.id);
  const meta = extractRequestMeta(req);
  await writeAuditLog({ tenantId: req.tenantId, userId: req.user.id, action: 'CONFIRM', tableName: 'sales_orders', recordId: req.params.id, newValues: { status: 'pick_ready' }, ...meta });
  return success(res, so, 'Order confirmed — pick list created');
};

module.exports = { getAll, getById, create, confirmOrder };
