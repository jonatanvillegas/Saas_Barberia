const express = require('express');
const router = express.Router();
const { 
  getMovimientos, 
  registrarMovimiento, 
  eliminarMovimiento,
  getEstadoCaja,
  abrirCaja,
  cerrarCaja
} = require('../controllers/cajaController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

// Estado de caja lo usamos también para barberos (CajaGuard), así que no lo restringimos.
router.get('/sesion', getEstadoCaja);
router.post('/abrir', authorize('admin', 'caja'), abrirCaja);
router.post('/cerrar', authorize('admin', 'caja'), cerrarCaja);

router.route('/')
  .get(authorize('admin', 'caja'), getMovimientos)
  .post(authorize('admin', 'caja'), registrarMovimiento);

router.route('/:id').delete(authorize('admin'), eliminarMovimiento);

module.exports = router;
