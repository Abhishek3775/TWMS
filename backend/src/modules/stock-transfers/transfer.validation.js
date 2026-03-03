'use strict';

const Joi = require('joi');

const statusEnum = ['draft', 'in_transit', 'received', 'cancelled'];

const createTransferSchema = Joi.object({
  transfer_number: Joi.string().max(50).required(),
  from_warehouse_id: Joi.string().uuid().required(),
  to_warehouse_id: Joi.string().uuid().required(),
  status: Joi.string().valid(...statusEnum).default('draft'),
  transfer_date: Joi.date().iso().required(),
  received_date: Joi.date().iso().allow(null),
  vehicle_number: Joi.string().max(50).allow(null, ''),
  notes: Joi.string().allow(null, ''),
});

const updateTransferSchema = Joi.object({
  transfer_number: Joi.string().max(50),
  from_warehouse_id: Joi.string().uuid(),
  to_warehouse_id: Joi.string().uuid(),
  status: Joi.string().valid(...statusEnum),
  transfer_date: Joi.date().iso(),
  received_date: Joi.date().iso().allow(null),
  vehicle_number: Joi.string().max(50).allow(null, ''),
  notes: Joi.string().allow(null, ''),
}).min(1);

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().max(100).allow('').optional(),
  sortBy: Joi.string().valid('transfer_number', 'transfer_date', 'created_at').optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC').optional(),
});

module.exports = {
  createTransferSchema,
  updateTransferSchema,
  listQuerySchema,
};
