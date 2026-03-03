'use strict';

const express = require('express');
const router = express.Router();
const transferController = require('./transfer.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.use(authenticate);

router.post('/', transferController.createTransfer);
router.get('/', transferController.getTransfers);
router.get('/:id', transferController.getTransferById);
router.put('/:id', transferController.updateTransfer);
router.delete('/:id', transferController.deleteTransfer);

module.exports = router;
