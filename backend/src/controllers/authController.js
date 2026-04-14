const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Barberia = require('../models/Barberia');

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password, slug } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    let usuario, barberia;

    if (!slug) {
      // Intentar loguear como superadmin si no hay slug
      usuario = await Usuario.findOne({ email: email.toLowerCase(), rol: 'superadmin' }).select('+password');
      if (!usuario || !usuario.activo) {
        return res.status(401).json({ success: false, message: 'Se requiere el slug de barbería, al menos que seas super administrador' });
      }
    } else {
      // Login normal para inqulinos
      barberia = await Barberia.findOne({ slug: slug.toLowerCase(), activo: true });
      if (!barberia) {
        return res.status(404).json({ success: false, message: 'Barbería no encontrada' });
      }

      usuario = await Usuario.findOne({ email: email.toLowerCase(), barberia: barberia._id }).select('+password');
      if (!usuario || !usuario.activo) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }
    }

    const passwordOk = await usuario.compararPassword(password);
    if (!passwordOk) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = generarToken(usuario._id);

    res.status(200).json({
      success: true,
      token,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        barberia: barberia ? { _id: barberia._id, nombre: barberia.nombre, slug: barberia.slug } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const usuario = await Usuario.findById(req.usuario._id).populate('barberia', 'nombre slug direccion telefono logo');
  res.status(200).json({ success: true, data: usuario });
};
