'use strict';

/**
 * Success response
 */
const success = (res, data = {}, message = 'Success', statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(Object.keys(meta).length && { meta }),
  });
};

/**
 * Created response (201)
 */
const created = (res, data = {}, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

/**
 * Error response
 */
const error = (res, message = 'Internal Server Error', statusCode = 500, code = 'INTERNAL_ERROR') => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

/**
 * Paginated response
 */
const paginated = (res, data, { page, limit, total }, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
};

module.exports = { success, created, error, paginated };
