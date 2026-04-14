const Colaborador = require('../models/Colaborador');

// GET /api/colaboradores
exports.getColaboradores = async (req, res, next) => {
  try {
    const { activo } = req.query;
    const filtro = { barberia: req.barberia };
    if (activo !== undefined) filtro.estado = activo === 'true';
    const colaboradores = await Colaborador.find(filtro).sort('nombre');
    res.status(200).json({ success: true, data: colaboradores });
  } catch (error) {
    next(error);
  }
};

// POST /api/colaboradores
exports.crearColaborador = async (req, res, next) => {
  try {
    const { nombre, telefono, tipoPago, porcentaje, salarioFijo } = req.body;
    const colaborador = await Colaborador.create({
      nombre, telefono, tipoPago, porcentaje, salarioFijo,
      barberia: req.barberia,
    });
    res.status(201).json({ success: true, data: colaborador });
  } catch (error) {
    next(error);
  }
};

// GET /api/colaboradores/:id
exports.getColaborador = async (req, res, next) => {
  try {
    const colaborador = await Colaborador.findOne({ _id: req.params.id, barberia: req.barberia });
    if (!colaborador) return res.status(404).json({ success: false, message: 'Colaborador no encontrado' });
    res.status(200).json({ success: true, data: colaborador });
  } catch (error) {
    next(error);
  }
};

// PUT /api/colaboradores/:id
exports.actualizarColaborador = async (req, res, next) => {
  try {
    const colaborador = await Colaborador.findOneAndUpdate(
      { _id: req.params.id, barberia: req.barberia },
      req.body,
      { new: true, runValidators: true }
    );
    if (!colaborador) return res.status(404).json({ success: false, message: 'Colaborador no encontrado' });
    res.status(200).json({ success: true, data: colaborador });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/colaboradores/:id (inactivar)
exports.eliminarColaborador = async (req, res, next) => {
  try {
    const colaborador = await Colaborador.findOne({ _id: req.params.id, barberia: req.barberia });
    if (!colaborador) return res.status(404).json({ success: false, message: 'Colaborador no encontrado' });
    colaborador.estado = false;
    await colaborador.save();
    res.status(200).json({ success: true, message: 'Colaborador inactivado' });
  } catch (error) {
    next(error);
  }
};
