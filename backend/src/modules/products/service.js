'use strict';
const repo = require('./repository');
const { AppError } = require('../../middlewares/error.middleware');

const getAll = (tenantId, queryParams) => repo.findAll(tenantId, queryParams);

const getById = async (id, tenantId) => {
  const product = await repo.findById(id, tenantId);
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
  return product;
};

const create = async (tenantId, data) => {
  const existing = await repo.findByCode(data.code, tenantId);
  if (existing) throw new AppError(`Product code '${data.code}' already exists`, 409, 'DUPLICATE_CODE');
  return repo.create({ ...data, tenantId });
};

const update = async (id, tenantId, data) => {
  await getById(id, tenantId);
  const codeConflict = await repo.findByCode(data.code, tenantId, id);
  if (codeConflict) throw new AppError(`Product code '${data.code}' already in use`, 409, 'DUPLICATE_CODE');
  return repo.update(id, tenantId, data);
};

const remove = async (id, tenantId) => {
  await getById(id, tenantId);
  await repo.softDelete(id, tenantId);
};

module.exports = { getAll, getById, create, update, remove };
