const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', protect, authorize('admin'), getDashboard);

module.exports = router;
