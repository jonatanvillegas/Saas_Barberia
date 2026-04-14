const Pago = require('../models/Pago');
const Colaborador = require('../models/Colaborador');

// GET /api/reportes/pagos
exports.reportePagos = async (req, res, next) => {
  try {
    const { desde, hasta, colaborador, usuario } = req.query;
    const filtro = { barberia: req.barberia };

    if (colaborador) filtro.colaborador = colaborador;
    if (usuario) filtro.usuarioRegistro = usuario;
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) {
        const hastaFin = new Date(hasta);
        hastaFin.setHours(23, 59, 59, 999);
        filtro.fecha.$lte = hastaFin;
      }
    }

    const pagos = await Pago.find(filtro)
      .populate('colaborador', 'nombre')
      .populate('usuarioRegistro', 'nombre')
      .sort({ fecha: -1 });

    const totalCortes = pagos.length;
    const totalGenerado = pagos.reduce((s, p) => s + p.montoServicio, 0);

    // Totales por barbero
    const porBarbero = {};
    for (const p of pagos) {
      const id = p.colaborador._id.toString();
      if (!porBarbero[id]) {
        porBarbero[id] = { nombre: p.colaborador.nombre, cortes: 0, total: 0 };
      }
      porBarbero[id].cortes += 1;
      porBarbero[id].total += p.montoServicio;
    }

    res.status(200).json({
      success: true,
      resumen: { totalCortes, totalGenerado, porBarbero: Object.values(porBarbero) },
      data: pagos,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reportes/colaboradores
exports.reporteColaboradores = async (req, res, next) => {
  try {
    const { desde, hasta, colaborador: colId } = req.query;
    const barberia = req.barberia;

    const filtroFecha = {};
    if (desde) filtroFecha.$gte = new Date(desde);
    if (hasta) {
      const hastaFin = new Date(hasta);
      hastaFin.setHours(23, 59, 59, 999);
      filtroFecha.$lte = hastaFin;
    }

    const filtroCol = { barberia };
    if (colId) filtroCol._id = colId;

    const colaboradores = await Colaborador.find(filtroCol);

    const reporte = await Promise.all(
      colaboradores.map(async (col) => {
        const filtroPago = { barberia, colaborador: col._id };
        if (desde || hasta) filtroPago.fecha = filtroFecha;

        const pagos = await Pago.find(filtroPago);
        const totalCortes = pagos.length;
        const totalGenerado = pagos.reduce((s, p) => s + p.montoServicio, 0);

        let ganancia = 0;
        if (col.tipoPago === 'porcentaje') {
          ganancia = totalGenerado * (col.porcentaje / 100);
        } else {
          ganancia = col.salarioFijo;
        }

        return {
          colaborador: { _id: col._id, nombre: col.nombre, tipoPago: col.tipoPago },
          totalCortes,
          totalGenerado,
          ganancia,
        };
      })
    );

    res.status(200).json({ success: true, data: reporte });
  } catch (error) {
    next(error);
  }
};
