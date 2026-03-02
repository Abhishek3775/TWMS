'use strict';
const router = require('express').Router();
const ctrl = require('./controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

router.use(authenticate);
router.get('/',            ctrl.getAll);
router.get('/:id',         ctrl.getById);
router.post('/',           requireRole(['super_admin','admin','accountant']), ctrl.createFromSO);
router.post('/:id/issue',  requireRole(['super_admin','admin','accountant']), ctrl.issueInvoice);
module.exports = router;
