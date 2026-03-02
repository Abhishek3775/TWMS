'use strict';
const router = require('express').Router();
const ctrl = require('./controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

router.use(authenticate);

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/',   requireRole(['super_admin','admin','sales']), ctrl.create);
router.post('/:id/confirm', requireRole(['super_admin','admin','sales']), ctrl.confirmOrder);

module.exports = router;
