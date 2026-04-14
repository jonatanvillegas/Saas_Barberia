const Usuario = require('../models/Usuario');
const Colaborador = require('../models/Colaborador');

// GET /api/usuarios
exports.getUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find({ barberia: req.barberia })
      .select('-password')
      .populate('colaborador', 'nombre')
      .sort('nombre');
    res.status(200).json({ success: true, data: usuarios });
  } catch (error) {
    next(error);
  }
};

// POST /api/usuarios
exports.crearUsuario = async (req, res, next) => {
  try {
    const { nombre, email, password, rol, colaborador } = req.body;

    if (rol === 'barbero') {
      if (!colaborador) {
        return res.status(400).json({ success: false, message: 'Debes asociar un colaborador para el usuario barbero' });
      }
      const colOk = await Colaborador.findOne({ _id: colaborador, barberia: req.barberia }).select('_id');
      if (!colOk) {
        return res.status(400).json({ success: false, message: 'El colaborador seleccionado no pertenece a esta barbería' });
      }
    }

    const usuario = await Usuario.create({ 
      nombre, 
      email, 
      password, 
      rol, 
      colaborador,
      barberia: req.barberia 
    });
    res.status(201).json({
      success: true,
      data: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, activo: usuario.activo, colaborador: usuario.colaborador },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/usuarios/:id
exports.getUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findOne({ _id: req.params.id, barberia: req.barberia })
      .select('-password')
      .populate('colaborador', 'nombre');
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.status(200).json({ success: true, data: usuario });
  } catch (error) {
    next(error);
  }
};

// PUT /api/usuarios/:id
exports.actualizarUsuario = async (req, res, next) => {
  try {
    const { nombre, email, rol, activo, password, colaborador } = req.body;
    const usuario = await Usuario.findOne({ _id: req.params.id, barberia: req.barberia });
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const rolFinal = rol ?? usuario.rol;
    const colaboradorFinal = colaborador !== undefined ? colaborador : usuario.colaborador;
    if (rolFinal === 'barbero') {
      if (!colaboradorFinal) {
        return res.status(400).json({ success: false, message: 'Debes asociar un colaborador para el usuario barbero' });
      }
      const colOk = await Colaborador.findOne({ _id: colaboradorFinal, barberia: req.barberia }).select('_id');
      if (!colOk) {
        return res.status(400).json({ success: false, message: 'El colaborador seleccionado no pertenece a esta barbería' });
      }
    }

    usuario.nombre = nombre ?? usuario.nombre;
    usuario.email = email ?? usuario.email;
    usuario.rol = rolFinal;
    usuario.colaborador = colaboradorFinal;
    if (activo !== undefined) usuario.activo = activo;
    if (password) usuario.password = password;

    await usuario.save();
    res.status(200).json({
      success: true,
      data: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, activo: usuario.activo, colaborador: usuario.colaborador },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/usuarios/:id (inactivar)
exports.eliminarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findOne({ _id: req.params.id, barberia: req.barberia });
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    // No eliminar físicamente, solo inactivar
    usuario.activo = false;
    await usuario.save();
    res.status(200).json({ success: true, message: 'Usuario inactivado' });
  } catch (error) {
    next(error);
  }
};
