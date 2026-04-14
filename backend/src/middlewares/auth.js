const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Barberia = require('../models/Barberia');

// Verificar JWT y adjuntar usuario al request
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No autorizado, token requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-password');

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ success: false, message: 'Usuario no válido o inactivo' });
    }

    req.usuario = usuario;
    req.barberia = usuario.barberia;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// Restricción por rol
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: `Rol '${req.usuario.rol}' no tiene permiso para esta acción`,
      });
    }
    next();
  };
};
