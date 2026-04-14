const express = require('express');
const router = express.Router();
const { getUsuarios, crearUsuario, getUsuario, actualizarUsuario, eliminarUsuario } = require('../controllers/usuariosController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('admin'));

router.route('/').get(getUsuarios).post(crearUsuario);
router.route('/:id').get(getUsuario).put(actualizarUsuario).delete(eliminarUsuario);

module.exports = router;
