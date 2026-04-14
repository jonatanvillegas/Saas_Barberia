const Pago = require('../models/Pago');
const Colaborador = require('../models/Colaborador');
const { parseStartOfDay, parseEndOfDay } = require('../utils/dates');

// GET /api/mi-indicador?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
// Endpoint específico para barberos: muestra su propio progreso (cortes/pagos) por rango.
exports.getMiIndicador = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');

    const barberia = req.barberia;
    const usuario = req.usuario;

    if (usuario.rol !== 'barbero') {
      return res.status(403).json({ success: false, message: 'No tienes permiso para ver este recurso' });
    }

    // Resolver el colaborador asociado al usuario barbero.
    // En el sistema, los pagos se asocian al barbero por `Pago.colaborador` (no por `usuarioRegistro`).
    let colaboradorId = usuario.colaborador || null;
    if (!colaboradorId) {
      // Fallback: si no está vinculado, intentamos por nombre dentro de la barbería (solo si hay 1 match exacto)
      const candidatos = await Colaborador.find({ barberia, nombre: usuario.nombre }).select('_id');
      if (candidatos.length === 1) {
        colaboradorId = candidatos[0]._id;
      }
    }

    if (!colaboradorId) {
      return res.status(200).json({
        success: true,
        data: {
          resumen: { totalCortes: 0, totalGenerado: 0, ganancia: 0 },
          esquemaPago: null,
          pagos: [],
          colaborador: null,
        },
        message: 'Tu cuenta no está vinculada a un colaborador. Contacta al administrador.',
      });
    }

    const { desde, hasta } = req.query;

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

    const inicio = (desde ? parseStartOfDay(desde) : null) || inicioHoy;
    const fin = (hasta ? parseEndOfDay(hasta) : null) || finHoy;

    const col = await Colaborador.findOne({ _id: colaboradorId, barberia });
    if (!col) {
      return res.status(200).json({
        success: true,
        data: {
          resumen: { totalCortes: 0, totalGenerado: 0, ganancia: 0 },
          esquemaPago: null,
          pagos: [],
          colaborador: null,
        },
        message: 'No se encontró el colaborador vinculado a tu cuenta en esta barbería.',
      });
    }

    // Filtramos por `fecha` (fecha del servicio) para que el rango desde/hasta
    // coincida con lo que selecciona el usuario.
    const pagos = await Pago.find({
      barberia,
      colaborador: col._id,
      fecha: { $gte: inicio, $lte: fin },
    })
      .sort({ fecha: -1 })
      .select('createdAt fecha tipoServicio montoServicio metodoPago');

    const totalCortes = pagos.length;
    const totalGenerado = pagos.reduce((s, p) => s + p.montoServicio, 0);

    let ganancia = 0;
    if (col.tipoPago === 'porcentaje') {
      ganancia = totalGenerado * (Number(col.porcentaje || 0) / 100);
    } else {
      // Requerimiento: si es fijo, la ganancia a mostrar es el monto fijo.
      ganancia = Number(col.salarioFijo || 0);
    }

    res.status(200).json({
      success: true,
      data: {
        rango: { desde: inicio, hasta: fin },
        colaborador: { _id: col._id, nombre: col.nombre },
        esquemaPago: {
          tipoPago: col.tipoPago,
          porcentaje: col.porcentaje,
          salarioFijo: col.salarioFijo,
        },
        resumen: {
          totalCortes,
          totalGenerado,
          ganancia,
        },
        pagos,
      },
    });
  } catch (error) {
    next(error);
  }
};
