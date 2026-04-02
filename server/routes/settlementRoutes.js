const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');
const { authMiddleware } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// Solo administradores o especialistas con permiso pueden gestionar liquidaciones
router.use(authMiddleware);
router.use(checkPermission('liquidaciones'));

router.get('/pending/:specialistId', settlementController.getPending);
router.post('/', settlementController.create);
router.get('/history/:specialistId', settlementController.getHistory);
router.get('/stats', settlementController.getGlobalStats);

module.exports = router;
