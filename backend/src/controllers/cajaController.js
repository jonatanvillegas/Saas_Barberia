const MovimientoCaja = require('../models/MovimientoCaja');
const CajaSesion = require('../models/CajaSesion');
const { parseForStorage, parseStartOfDay, parseEndOfDay } = require('../utils/dates');

// GET /api/caja/sesion — obtener estado actual de la caja
exports.getEstadoCaja = async (req, res, next) => {
  try {
    const sesion = await CajaSesion.findOne({
      barberia: req.barberia,
      estado: 'abierta',
    }).populate('usuarioApertura', 'nombre');

    res.status(200).json({
      success: true,
      abierta: !!sesion,
      data: sesion,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/caja/abrir — abrir la caja
exports.abrirCaja = async (req, res, next) => {
  try {
    const sesionExistente = await CajaSesion.findOne({ barberia: req.barberia, estado: 'abierta' });
    if (sesionExistente) {
      return res.status(400).json({ success: false, message: 'La caja ya está abierta' });
    }

    const { montoApertura } = req.body;
    if (montoApertura === undefined || montoApertura < 0) {
      return res.status(400).json({ success: false, message: 'Monto de apertura inválido' });
    }

    const sesion = await CajaSesion.create({
      barberia: req.barberia,
      usuarioApertura: req.usuario._id,
      montoApertura,
      estado: 'abierta',
    });

    res.status(201).json({ success: true, data: sesion });
  } catch (error) {
    next(error);
  }
};

// POST /api/caja/cerrar — cerrar la caja (arqueo)
exports.cerrarCaja = async (req, res, next) => {
  try {
    const sesion = await CajaSesion.findOne({ barberia: req.barberia, estado: 'abierta' });
    if (!sesion) {
      return res.status(400).json({ success: false, message: 'La caja no está abierta' });
    }

    const { montoCierre } = req.body;
    if (montoCierre === undefined || montoCierre < 0) {
      return res.status(400).json({ success: false, message: 'Monto de cierre inválido' });
    }

    // Calcular totales del periodo
    const movimientos = await MovimientoCaja.find({
      barberia: req.barberia,
      fecha: { $gte: sesion.fechaApertura },
    });

    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
    const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);

    sesion.usuarioCierre = req.usuario._id;
    sesion.montoCierre = montoCierre;
    sesion.ingresosEsperados = ingresos;
    sesion.egresosEsperados = egresos;
    sesion.estado = 'cerrada';
    sesion.fechaCierre = Date.now();

    await sesion.save();

    res.status(200).json({ success: true, data: sesion });
  } catch (error) {
    next(error);
  }
};

// GET /api/caja — listar movimientos con balance
exports.getMovimientos = async (req, res, next) => {
  try {
    const { desde, hasta, tipo } = req.query;
    const filtro = { barberia: req.barberia };
    if (tipo) filtro.tipo = tipo;
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = parseStartOfDay(desde);
      if (hasta) {
        filtro.fecha.$lte = parseEndOfDay(hasta);
      }
    }

    const movimientos = await MovimientoCaja.find(filtro)
      .populate('usuario', 'nombre')
      .sort({ fecha: -1 });

    // Calcular balance global del periodo filtrado
    const totales = movimientos.reduce(
      (acc, m) => {
        if (m.tipo === 'ingreso') acc.ingresos += m.monto;
        else acc.egresos += m.monto;
        return acc;
      },
      { ingresos: 0, egresos: 0 }
    );
    totales.balance = totales.ingresos - totales.egresos;

    res.status(200).json({ success: true, data: movimientos, totales });
  } catch (error) {
    next(error);
  }
};

// POST /api/caja — registrar egreso manual
exports.registrarMovimiento = async (req, res, next) => {
  try {
    const sesion = await CajaSesion.findOne({ barberia: req.barberia, estado: 'abierta' });
    if (!sesion) {
      return res.status(400).json({ success: false, message: 'La caja debe estar abierta para registrar movimientos' });
    }

    const { tipo, categoria, monto, descripcion, fecha } = req.body;

    const fechaDoc = parseForStorage(fecha) || new Date();
    const movimiento = await MovimientoCaja.create({
      tipo,
      categoria,
      monto,
      descripcion,
      fecha: fechaDoc,
      usuario: req.usuario._id,
      barberia: req.barberia,
    });
    res.status(201).json({ success: true, data: movimiento });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/caja/:id
exports.eliminarMovimiento = async (req, res, next) => {
  try {
    const movimiento = await MovimientoCaja.findOne({ _id: req.params.id, barberia: req.barberia });
    if (!movimiento) return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
    
    if (movimiento.pago) {
      return res.status(400).json({ success: false, message: 'No se puede eliminar un movimiento generado por un pago' });
    }
    await movimiento.deleteOne();
    res.status(200).json({ success: true, message: 'Movimiento eliminado' });
  } catch (error) {
    next(error);
  }
};
