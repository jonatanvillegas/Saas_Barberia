const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI no está definido');
    }

    // En entornos serverless (Vercel) este módulo puede ejecutarse muchas veces.
    // Reutilizamos la conexión si ya existe.
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
