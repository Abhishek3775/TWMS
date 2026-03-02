'use strict';

const repo = require('./repository');
const { AppError } = require('../../middlewares/error.middleware');

const getAll = (tenantId) => repo.findAll(tenantId);

const getById = async (id, tenantId) => {
  const category = await repo.findById(id, tenantId);
  if (!category) {
    throw new AppError('Category not found', 404, 'NOT_FOUND');
  }
  return category;
};

const create = async (tenantId, data) => {
  const duplicate = await repo.findByName(data.name, tenantId);
  if (duplicate) {
    throw new AppError('Category already exists', 409, 'DUPLICATE');
  }

  if (data.parentId) {
    const parent = await repo.findById(data.parentId, tenantId);
    if (!parent) {
      throw new AppError('Invalid parent category', 400, 'INVALID_PARENT');
    }
  }

  return repo.create(tenantId, data);
};

const update = async (id, tenantId, data) => {
  const existing = await getById(id, tenantId);

  if (data.name) {
    const duplicate = await repo.findByName(data.name, tenantId, id);
    if (duplicate) {
      throw new AppError('Category already exists', 409, 'DUPLICATE');
    }
  }

  if (data.parentId) {
    if (data.parentId === id) {
      throw new AppError('Category cannot be its own parent', 400, 'INVALID_PARENT');
    }

    const parent = await repo.findById(data.parentId, tenantId);
    if (!parent) {
      throw new AppError('Invalid parent category', 400, 'INVALID_PARENT');
    }
  }

  return repo.update(id, tenantId, data);
};

const remove = async (id, tenantId) => {
  await getById(id, tenantId);
  await repo.softDelete(id, tenantId);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};