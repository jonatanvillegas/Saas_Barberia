const Pago = require('../models/Pago');
const Colaborador = require('../models/Colaborador');
const { parseStartOfDay, parseEndOfDay } = require('../utils/dates');

// GET /api/indicadores
exports.getIndicadores = async (req, res, next) => {
  try {
    const barberia = req.barberia;
    const { desde, hasta, colaborador } = req.query;

    // Caja no debe ver indicadores
    if (req.usuario?.rol === 'caja') {
      return res.status(403).json({ success: false, message: 'No tienes permiso para ver indicadores' });
    }

    const filtroFecha = {};
    if (desde) filtroFecha.$gte = parseStartOfDay(desde);
    if (hasta) {
      filtroFecha.$lte = parseEndOfDay(hasta);
    }

    const filtroPago = { barberia };
    if (desde || hasta) filtroPago.fecha = filtroFecha;

    let colaboradores;
    // Barbero: solo su propio indicador (ignora filtros de colaborador)
    if (req.usuario?.rol === 'barbero') {
      if (!req.usuario.colaborador) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'Tu cuenta no está vinculada a un colaborador. Contacta al administrador.',
        });
      }
      colaboradores = await Colaborador.find({ _id: req.usuario.colaborador, barberia });
    } else {
      if (colaborador) {
        colaboradores = await Colaborador.find({ _id: colaborador, barberia });
      } else {
        colaboradores = await Colaborador.find({ barberia });
      }
    }

    const indicadores = await Promise.all(
      colaboradores.map(async (col) => {
        const pagos = await Pago.find({ ...filtroPago, colaborador: col._id });
        const totalCortes = pagos.length;
        const totalGenerado = pagos.reduce((s, p) => s + p.montoServicio, 0);
        const promedioPorCorte = totalCortes > 0 ? totalGenerado / totalCortes : 0;

        let ganancia = 0;
        if (col.tipoPago === 'porcentaje') {
          ganancia = totalGenerado * (col.porcentaje / 100);
        } else {
          // Si es fijo, podríamos prorratear o mostrar el fijo mensual. 
          // El usuario no especificó, mantendremos la lógica actual de mostrar el fijo.
          ganancia = col.salarioFijo;
        }

        return {
          colaborador: { _id: col._id, nombre: col.nombre, tipoPago: col.tipoPago, porcentaje: col.porcentaje, salarioFijo: col.salarioFijo, estado: col.estado },
          totalCortes,
          totalGenerado,
          ganancia,
          promedioPorCorte: parseFloat(promedioPorCorte.toFixed(2)),
        };
      })
    );

    // Ordenar por total generado desc
    indicadores.sort((a, b) => b.totalGenerado - a.totalGenerado);

    res.status(200).json({ success: true, data: indicadores });
  } catch (error) {
    next(error);
  }
};
