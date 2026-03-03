'use strict';

const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  WAREHOUSE_MANAGER: 'warehouse_manager',
  SALES: 'sales',
  ACCOUNTANT: 'accountant',
  USER: 'user',
});

// Role hierarchy (higher index = higher privilege)
const ROLE_HIERARCHY = [
  ROLES.USER,
  ROLES.SALES,
  ROLES.ACCOUNTANT,
  ROLES.WAREHOUSE_MANAGER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

/**
 * Route-level permissions matrix.
 * Key: 'METHOD /path/pattern'
 * Value: array of allowed roles
 */
const PERMISSIONS = {
  // Setup
  'GET /warehouses':         [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.SALES, ROLES.ACCOUNTANT],
  'POST /warehouses':        [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'PUT /warehouses/:id':     [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'DELETE /warehouses/:id':  [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // Users
  'GET /users':              [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'POST /users':             [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'PUT /users/:id':          [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'DELETE /users/:id':       [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // Products
  'GET /products':           Object.values(ROLES),
  'POST /products':          [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'PUT /products/:id':       [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // Purchase Orders
  'POST /purchase-orders':            [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],
  'PUT /purchase-orders/:id/confirm': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // GRN
  'POST /grn':               [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],
  'POST /grn/:id/post':      [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],

  // Stock Transfers (execute = dispatch stock)
  'POST /stock-transfers/:id/execute': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],

  // Stock Adjustments
  'POST /stock-adjustments':           [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],
  'PUT /stock-adjustments/:id/approve':[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER],

  // Sales
  'POST /sales-orders':      [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES],
  'PUT /sales-orders/:id/confirm': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES],

  // Invoices
  'POST /invoices':          [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT],
  'POST /invoices/:id/issue':[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT],

  // Accounts
  'POST /customer-payments': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT],
  'POST /vendor-payments':   [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT],

  // Reports
  'GET /reports':            [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT],
};

module.exports = { ROLES, ROLE_HIERARCHY, PERMISSIONS };
