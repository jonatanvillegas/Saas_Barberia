const express = require('express');
const router = express.Router();
const { reportePagos, reporteColaboradores } = require('../controllers/reportesController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/pagos', reportePagos);
router.get('/colaboradores', reporteColaboradores);

module.exports = router;
