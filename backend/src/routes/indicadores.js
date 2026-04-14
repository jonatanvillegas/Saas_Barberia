const express = require('express');
const router = express.Router();
const { getIndicadores } = require('../controllers/indicadoresController');
const { protect } = require('../middlewares/auth');

router.get('/', protect, getIndicadores);

module.exports = router;
