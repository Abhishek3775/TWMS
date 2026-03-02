'use strict';
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: env.security.rateLimitWindowMs,
  max: env.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' },
  },
  keyGenerator: (req) => `${req.ip}_${req.tenantId || 'anon'}`,
});

/**
 * Strict limiter for auth endpoints (prevent brute force)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts, please try again in 15 minutes.' },
  },
});

module.exports = { apiLimiter, authLimiter };
