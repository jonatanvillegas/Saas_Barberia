require('dotenv').config();
const connectDB = require('./src/config/db');
const Usuario = require('./src/models/Usuario');
const Barberia = require('./src/models/Barberia');
const CajaSesion = require('./src/models/CajaSesion');
const Colaborador = require('./src/models/Colaborador');
const Pago = require('./src/models/Pago');
const MovimientoCaja = require('./src/models/MovimientoCaja');

const cleanDB = async () => {
  await connectDB();
  console.log('🧹 Limpiando Base de Datos...');

  try {
    await Usuario.deleteMany({});
    await Barberia.deleteMany({});
    await CajaSesion.deleteMany({});
    await Colaborador.deleteMany({});
    await Pago.deleteMany({});
    await MovimientoCaja.deleteMany({});
    console.log('✅ Todas las colecciones han sido borradas.');

    const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'root123';
    const rootUser = await Usuario.create({
      nombre: 'Super Root',
      email: 'root@sistema.com',
      password: superadminPassword, // Cambiar en un entorno real
      rol: 'superadmin',
      barberia: null,
    });
    console.log('👑 Super Administrador Creado:');
    console.log(`   ✉️  Email: ${rootUser.email}`);
    console.log(`   🔑 Contraseña: ${superadminPassword}`);

    console.log('\n✅ Limpieza Finalizada. Puedes correr `npm run seed` si deseas poblar con demo.');
  } catch (err) {
    console.error('❌ Error al limpiar:', err.message);
  } finally {
    process.exit(0);
  }
};

cleanDB();
