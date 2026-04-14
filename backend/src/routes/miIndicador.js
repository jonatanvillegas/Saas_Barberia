const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getMiIndicador } = require('../controllers/miIndicadorController');

router.get('/', protect, getMiIndicador);

module.exports = router;
