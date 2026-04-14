const express = require('express');
const router = express.Router();
const { getPagos, crearPago, getPago, actualizarPago, eliminarPago } = require('../controllers/pagosController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/').get(authorize('admin', 'caja'), getPagos).post(authorize('admin', 'caja'), crearPago);
router.route('/:id')
  .get(authorize('admin', 'caja'), getPago)
  .put(authorize('admin', 'caja'), actualizarPago)
  .delete(authorize('admin'), eliminarPago);

module.exports = router;
