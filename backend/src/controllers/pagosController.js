const Pago = require('../models/Pago');
const MovimientoCaja = require('../models/MovimientoCaja');
const CajaSesion = require('../models/CajaSesion');
const { parseForStorage, parseStartOfDay, parseEndOfDay } = require('../utils/dates');

// GET /api/pagos
exports.getPagos = async (req, res, next) => {
  try {
    const { desde, hasta, colaborador, usuario } = req.query;
    const filtro = { barberia: req.barberia };
    if (colaborador) filtro.colaborador = colaborador;
    if (usuario) filtro.usuarioRegistro = usuario;
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = parseStartOfDay(desde);
      if (hasta) {
        filtro.fecha.$lte = parseEndOfDay(hasta);
      }
    }

    const pagos = await Pago.find(filtro)
      .populate('colaborador', 'nombre tipoPago porcentaje salarioFijo')
      .populate('usuarioRegistro', 'nombre')
      .sort({ fecha: -1 });

    res.status(200).json({ success: true, total: pagos.length, data: pagos });
  } catch (error) {
    next(error);
  }
};

// POST /api/pagos
exports.crearPago = async (req, res, next) => {
  try {
    // Validar que la caja esté abierta
    const sesion = await CajaSesion.findOne({ barberia: req.barberia, estado: 'abierta' });
    if (!sesion) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede registrar pagos si la caja está cerrada. Un administrador o cajero debe aperturar la caja.' 
      });
    }

    const { colaborador, tipoServicio, montoServicio, montoPagado, metodoPago, fecha } = req.body;

    const fechaDoc = parseForStorage(fecha) || new Date();

    const pago = await Pago.create({
      colaborador,
      tipoServicio: tipoServicio || 'Corte',
      montoServicio,
      montoPagado,
      metodoPago: metodoPago || 'efectivo',
      fecha: fechaDoc,
      usuarioRegistro: req.usuario._id,
      barberia: req.barberia,
    });

    // Auto-generar ingreso en caja
    await MovimientoCaja.create({
      tipo: 'ingreso',
      categoria: 'Corte',
      monto: montoServicio,
      descripcion: `Pago registrado - ${tipoServicio || 'Corte'}`,
      fecha: pago.fecha,
      pago: pago._id,
      usuario: req.usuario._id,
      barberia: req.barberia,
    });

    await pago.populate('colaborador', 'nombre');
    res.status(201).json({ success: true, data: pago });
  } catch (error) {
    next(error);
  }
};

// GET /api/pagos/:id
exports.getPago = async (req, res, next) => {
  try {
    const pago = await Pago.findOne({ _id: req.params.id, barberia: req.barberia })
      .populate('colaborador', 'nombre tipoPago porcentaje salarioFijo')
      .populate('usuarioRegistro', 'nombre');
    if (!pago) return res.status(404).json({ success: false, message: 'Pago no encontrado' });
    res.status(200).json({ success: true, data: pago });
  } catch (error) {
    next(error);
  }
};

// PUT /api/pagos/:id
exports.actualizarPago = async (req, res, next) => {
  try {
    const { colaborador, tipoServicio, montoServicio, montoPagado, metodoPago, fecha } = req.body;

    const pago = await Pago.findOne({ _id: req.params.id, barberia: req.barberia });
    if (!pago) return res.status(404).json({ success: false, message: 'Pago no encontrado' });

    const montoAnterior = pago.montoServicio;

    pago.colaborador = colaborador ?? pago.colaborador;
    pago.tipoServicio = tipoServicio ?? pago.tipoServicio;
    pago.montoServicio = montoServicio ?? pago.montoServicio;
    pago.montoPagado = montoPagado ?? pago.montoPagado;
    pago.metodoPago = metodoPago ?? pago.metodoPago;
    if (fecha) {
      const fechaDoc = parseForStorage(fecha);
      if (fechaDoc) pago.fecha = fechaDoc;
    }

    await pago.save();

    // Actualizar movimiento de caja asociado
    if (montoServicio && montoServicio !== montoAnterior) {
      await MovimientoCaja.findOneAndUpdate(
        { pago: pago._id, barberia: req.barberia },
        { monto: montoServicio, descripcion: `Pago editado - ${pago.tipoServicio}` }
      );
    }

    await pago.populate('colaborador', 'nombre');
    res.status(200).json({ success: true, data: pago });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/pagos/:id
exports.eliminarPago = async (req, res, next) => {
  try {
    const pago = await Pago.findOne({ _id: req.params.id, barberia: req.barberia });
    if (!pago) return res.status(404).json({ success: false, message: 'Pago no encontrado' });

    // Eliminar movimiento de caja asociado
    await MovimientoCaja.findOneAndDelete({ pago: pago._id, barberia: req.barberia });
    await pago.deleteOne();

    res.status(200).json({ success: true, message: 'Pago eliminado' });
  } catch (error) {
    next(error);
  }
};
