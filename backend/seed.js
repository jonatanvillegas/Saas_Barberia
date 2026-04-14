/**
 * Script de Seed — Barbería Pro
 * Crea una barbería de prueba con admin, colaboradores y datos de ejemplo
 * Uso: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Barberia = require('./src/models/Barberia');
const Usuario = require('./src/models/Usuario');
const Colaborador = require('./src/models/Colaborador');
const Pago = require('./src/models/Pago');
const MovimientoCaja = require('./src/models/MovimientoCaja');

const connectDB = require('./src/config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Iniciando seed...\n');

  // Limpiar datos anteriores del tenant de prueba
  const barberiaExistente = await Barberia.findOne({ slug: 'barberia-demo' });
  if (barberiaExistente) {
    await Usuario.deleteMany({ barberia: barberiaExistente._id });
    await Colaborador.deleteMany({ barberia: barberiaExistente._id });
    await Pago.deleteMany({ barberia: barberiaExistente._id });
    await MovimientoCaja.deleteMany({ barberia: barberiaExistente._id });
    await Barberia.deleteOne({ _id: barberiaExistente._id });
    console.log('🗑️  Datos anteriores eliminados');
  }

  // 1. Crear barbería
  const barberia = await Barberia.create({
    nombre: 'Barbería El Estilo',
    slug: 'barberia-demo',
    direccion: 'Barrio El Carmen, Managua, Nicaragua',
    telefono: '8888-9999',
  });
  console.log(`✅ Barbería creada: ${barberia.nombre} (slug: ${barberia.slug})`);

  // 2. Crear usuarios
  const admin = await Usuario.create({
    nombre: 'Admin Principal',
    email: 'admin@demo.com',
    password: 'admin123',
    rol: 'admin',
    barberia: barberia._id,
  });

  const cajero = await Usuario.create({
    nombre: 'María Cajera',
    email: 'caja@demo.com',
    password: 'caja123',
    rol: 'caja',
    barberia: barberia._id,
  });

  console.log(`✅ Usuarios creados: admin@demo.com / caja@demo.com`);

  // 3. Crear colaboradores
  const carlos = await Colaborador.create({
    nombre: 'Carlos Méndez',
    telefono: '8111-2222',
    tipoPago: 'porcentaje',
    porcentaje: 50,
    barberia: barberia._id,
  });

  const juan = await Colaborador.create({
    nombre: 'Juan Flores',
    telefono: '8333-4444',
    tipoPago: 'porcentaje',
    porcentaje: 45,
    barberia: barberia._id,
  });

  const pedro = await Colaborador.create({
    nombre: 'Pedro López',
    telefono: '8555-6666',
    tipoPago: 'fijo',
    salarioFijo: 8000,
    barberia: barberia._id,
  });

  console.log(`✅ Colaboradores creados: Carlos (50%), Juan (45%), Pedro (fijo C$8,000)`);

  // 4. Crear pagos del mes actual
  const hoy = new Date();
  const pagosData = [
    // Esta semana
    { colaborador: carlos._id, monto: 200, pagado: 200, dia: 0 },
    { colaborador: juan._id, monto: 150, pagado: 200, dia: 0 },
    { colaborador: carlos._id, monto: 250, pagado: 300, dia: 0 },
    { colaborador: pedro._id, monto: 180, pagado: 200, dia: 1 },
    { colaborador: carlos._id, monto: 200, pagado: 200, dia: 1 },
    { colaborador: juan._id, monto: 200, pagado: 250, dia: 2 },
    { colaborador: pedro._id, monto: 150, pagado: 150, dia: 2 },
    { colaborador: carlos._id, monto: 300, pagado: 300, dia: 3 },
    { colaborador: juan._id, monto: 180, pagado: 200, dia: 3 },
    { colaborador: carlos._id, monto: 200, pagado: 200, dia: 4 },
    { colaborador: pedro._id, monto: 200, pagado: 200, dia: 4 },
    { colaborador: carlos._id, monto: 250, pagado: 300, dia: 5 },
    { colaborador: juan._id, monto: 150, pagado: 200, dia: 5 },
    { colaborador: carlos._id, monto: 200, pagado: 200, dia: 6 },
    // Hoy
    { colaborador: carlos._id, monto: 200, pagado: 200, dia: -1 },
    { colaborador: juan._id, monto: 250, pagado: 300, dia: -1 },
    { colaborador: pedro._id, monto: 180, pagado: 200, dia: -1 },
  ];

  const metodos = ['efectivo', 'efectivo', 'efectivo', 'transferencia', 'efectivo'];
  const servicios = ['Corte', 'Corte y Barba', 'Corte', 'Diseño', 'Corte Niño', 'Barba'];

  for (let i = 0; i < pagosData.length; i++) {
    const { colaborador, monto, pagado, dia } = pagosData[i];
    const fecha = new Date(hoy);
    if (dia === -1) {
      // Hoy
    } else {
      fecha.setDate(fecha.getDate() - dia);
    }
    fecha.setHours(9 + (i % 9), (i * 7) % 60, 0, 0);

    const pago = await Pago.create({
      colaborador,
      tipoServicio: servicios[i % servicios.length],
      montoServicio: monto,
      montoPagado: pagado,
      metodoPago: metodos[i % metodos.length],
      fecha,
      usuarioRegistro: i % 3 === 0 ? cajero._id : admin._id,
      barberia: barberia._id,
    });

    await MovimientoCaja.create({
      tipo: 'ingreso',
      categoria: 'Corte',
      monto,
      descripcion: `Pago registrado - ${pago.tipoServicio}`,
      fecha,
      pago: pago._id,
      usuario: admin._id,
      barberia: barberia._id,
    });
  }

  console.log(`✅ ${pagosData.length} pagos creados con movimientos de caja`);

  // 5. Crear algunos egresos
  const egresos = [
    { categoria: 'Productos', monto: 500, descripcion: 'Compra de shampoo y gel' },
    { categoria: 'Servicios', monto: 1200, descripcion: 'Pago de energía eléctrica' },
    { categoria: 'Equipos', monto: 800, descripcion: 'Reparación de silla barbero' },
  ];

  for (const eg of egresos) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 5));
    await MovimientoCaja.create({
      tipo: 'egreso',
      ...eg,
      fecha,
      usuario: admin._id,
      barberia: barberia._id,
    });
  }

  console.log(`✅ ${egresos.length} egresos creados`);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETADO EXITOSAMENTE');
  console.log('='.repeat(50));
  console.log('\n📋 CREDENCIALES DE ACCESO:');
  console.log('   Slug de barbería : barberia-demo');
  console.log('   Admin email      : admin@demo.com');
  console.log('   Admin password   : admin123');
  console.log('   Cajero email     : caja@demo.com');
  console.log('   Cajero password  : caja123');
  console.log('\n🌐 Frontend : http://localhost:5173');
  console.log('🚀 Backend  : http://localhost:5000');
  console.log('='.repeat(50) + '\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
