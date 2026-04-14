const Barberia = require('../models/Barberia');
const Usuario = require('../models/Usuario');

// GET /api/superadmin/barberias
exports.getBarberias = async (req, res, next) => {
  try {
    const barberias = await Barberia.find().sort({ createdAt: -1 });
    
    // Obtener administradores principales de cada barbería
    const result = [];
    for (const b of barberias) {
      const admin = await Usuario.findOne({ barberia: b._id, rol: 'admin' }).select('nombre email activo');
      result.push({
        barberia: b,
        admin: admin || null,
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// POST /api/superadmin/barberias
exports.crearBarberia = async (req, res, next) => {
  try {
    const { nombre, slug, adminName, adminEmail, adminPassword } = req.body;

    // Crear inquilino
    const barberia = await Barberia.create({
      nombre,
      slug: slug.toLowerCase(),
    });

    // Crear administrador
    const admin = await Usuario.create({
      nombre: adminName || 'Admin',
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      rol: 'admin',
      barberia: barberia._id,
    });

    res.status(201).json({ success: true, data: { barberia, admin: { email: admin.email, nombre: admin.nombre } } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/superadmin/barberias/:id (toggle status)
exports.toggleBarberia = async (req, res, next) => {
  try {
    const barberia = await Barberia.findById(req.params.id);
    if (!barberia) return res.status(404).json({ success: false, message: 'Barbería no encontrada' });

    barberia.activo = req.body.activo !== undefined ? req.body.activo : !barberia.activo;
    await barberia.save();

    res.status(200).json({ success: true, data: barberia });
  } catch (error) {
    next(error);
  }
};
