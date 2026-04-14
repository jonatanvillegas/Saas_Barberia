const express = require('express');
const { getBarberias, crearBarberia, toggleBarberia } = require('../controllers/superadminController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas de superadmin requieren estar autenticado y tener rol 'superadmin'
router.use(protect);
router.use(authorize('superadmin'));

router.route('/barberias')
  .get(getBarberias)
  .post(crearBarberia);

router.route('/barberias/:id')
  .put(toggleBarberia);

module.exports = router;
