const Pago = require('../models/Pago');
const Colaborador = require('../models/Colaborador');

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const barberia = req.barberia;
    const usuario = req.usuario;
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // --- DASHBOARD PARA ADMIN / CAJA ---
    if (usuario.rol === 'admin' || usuario.rol === 'caja') {
      // Total hoy
      const pagosHoy = await Pago.find({ barberia, createdAt: { $gte: inicioHoy } });
      const totalHoy = pagosHoy.reduce((s, p) => s + p.montoServicio, 0);
      const cortesHoy = pagosHoy.length;

      // Total mes
      const pagosMes = await Pago.find({ barberia, createdAt: { $gte: inicioMes } });
      const totalMes = pagosMes.reduce((s, p) => s + p.montoServicio, 0);

      // Desglose por colaborador (Este mes)
      const colaboradores = await Colaborador.find({ barberia });
      const desgloseColaboradores = await Promise.all(colaboradores.map(async (col) => {
        const pagosColMes = await Pago.find({ barberia, colaborador: col._id, createdAt: { $gte: inicioMes } });
        const generado = pagosColMes.reduce((s, p) => s + p.montoServicio, 0);
        return {
          nombre: col.nombre,
          cortes: pagosColMes.length,
          generado
        };
      }));

      return res.status(200).json({
        success: true,
        rol: usuario.rol,
        data: {
          hoy: { totalGenerado: totalHoy, cortes: cortesHoy },
          mes: { totalGenerado: totalMes },
          desgloseColaboradores: desgloseColaboradores.sort((a,b) => b.generado - a.generado)
        },
      });
    }

    // --- DASHBOARD PARA BARBERO ---
    const colId = usuario.colaborador;
    
    // Buscar info del colaborador si existe el vínculo
    const col = colId ? await Colaborador.findById(colId) : null;
    
    const filtroPersonalHoy = { barberia, fecha: { $gte: inicioHoy } };
    if (colId) {
      filtroPersonalHoy.colaborador = colId;
    } else {
      // Si el usuario no tiene colaborador vinculado, no debería ver registros
      return res.status(200).json({
        success: true,
        rol: usuario.rol,
        data: {
          hoy: { cortes: 0, totalGenerado: 0, gananciaEstimada: 0 },
          historial: [],
          colaborador: null,
          mensaje: 'Tu cuenta de usuario no está vinculada a un colaborador. Contacta al administrador.'
        }
      });
    }

    const pagosPersonalHoy = await Pago.find(filtroPersonalHoy);
    const cortesHoy = pagosPersonalHoy.length;
    const totalGeneradoHoy = pagosPersonalHoy.reduce((s, p) => s + p.montoServicio, 0);

    // Calcular ganancia si es por porcentaje
    let gananciaHoy = 0;
    if (col && col.tipoPago === 'porcentaje') {
      gananciaHoy = totalGeneradoHoy * (col.porcentaje / 100);
    }

    // Historial reciente (últimos 10 servicios del barbero)
    const historialRedu = await Pago.find({ colaborador: colId })
      .sort({ fecha: -1 })
      .limit(10)
      .select('fecha tipoServicio montoServicio');

    res.status(200).json({
      success: true,
      rol: usuario.rol,
      data: {
        hoy: { 
          cortes: cortesHoy, 
          totalGenerado: totalGeneradoHoy,
          gananciaEstimada: gananciaHoy 
        },
        historial: historialRedu,
        colaborador: col ? { nombre: col.nombre, tipoPago: col.tipoPago, porcentaje: col.porcentaje } : null
      }
    });

  } catch (error) {
    next(error);
  }
};
