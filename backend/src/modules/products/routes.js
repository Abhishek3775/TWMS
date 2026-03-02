'use strict';
const router = require('express').Router();
const ctrl = require('./controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole, requireMinRole } = require('../../middlewares/role.middleware');
const { validate, productSchema, updateProductSchema } = require('./validation');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireMinRole('admin'), validate(productSchema), ctrl.create);
router.put('/:id', requireMinRole('admin'), validate(updateProductSchema), ctrl.update);
router.delete('/:id', requireMinRole('admin'), ctrl.remove);

module.exports = router;
