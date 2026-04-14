const express = require('express');
const router = express.Router();
const { getColaboradores, crearColaborador, getColaborador, actualizarColaborador, eliminarColaborador } = require('../controllers/colaboradoresController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'caja'), getColaboradores)
  .post(authorize('admin'), crearColaborador);
router.route('/:id')
  .get(authorize('admin', 'caja'), getColaborador)
  .put(authorize('admin'), actualizarColaborador)
  .delete(authorize('admin'), eliminarColaborador);

module.exports = router;
