const Barberia = require('../models/Barberia');
const Usuario = require('../models/Usuario');

// POST /api/barberias — registrar nueva barbería (público, para setup)
exports.crearBarberia = async (req, res, next) => {
  try {
    const { nombre, slug, direccion, telefono, adminNombre, adminEmail, adminPassword } = req.body;

    if (!nombre || !slug || !adminNombre || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: 'Todos los campos obligatorios requeridos' });
    }

    const existeSlug = await Barberia.findOne({ slug: slug.toLowerCase() });
    if (existeSlug) {
      return res.status(400).json({ success: false, message: 'El slug ya está en uso' });
    }

    const barberia = await Barberia.create({ nombre, slug: slug.toLowerCase(), direccion, telefono });

    // Crear usuario admin automáticamente
    await Usuario.create({
      nombre: adminNombre,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      rol: 'admin',
      barberia: barberia._id,
    });

    res.status(201).json({
      success: true,
      message: 'Barbería creada. Ya puedes iniciar sesión.',
      data: { barberia: { nombre: barberia.nombre, slug: barberia.slug } },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/barberias/info — info de la barbería del usuario logueado
exports.getInfo = async (req, res, next) => {
  try {
    const barberia = await Barberia.findById(req.barberia);
    res.status(200).json({ success: true, data: barberia });
  } catch (error) {
    next(error);
  }
};

// PUT /api/barberias/info — actualizar info (solo admin)
exports.actualizarInfo = async (req, res, next) => {
  try {
    const { nombre, direccion, telefono, logo } = req.body;
    const barberia = await Barberia.findByIdAndUpdate(
      req.barberia,
      { nombre, direccion, telefono, logo },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: barberia });
  } catch (error) {
    next(error);
  }
};
