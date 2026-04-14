const express = require('express');
const router = express.Router();
const { crearBarberia, getInfo, actualizarInfo } = require('../controllers/barberiaController');
const { protect, authorize } = require('../middlewares/auth');

// Público — para registrar nueva barbería
router.post('/', crearBarberia);

// Protegidos
router.get('/info', protect, getInfo);
router.put('/info', protect, authorize('admin'), actualizarInfo);

module.exports = router;
