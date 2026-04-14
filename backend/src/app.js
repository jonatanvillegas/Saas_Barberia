require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Conectar a MongoDB
connectDB();

const app = express();

// Evita 304 por caching condicional (ETag). Útil en desarrollo.
app.set('etag', false);

// Middlewares globales
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/barberias', require('./routes/barberias'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/colaboradores', require('./routes/colaboradores'));
app.use('/api/caja', require('./routes/caja'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/indicadores', require('./routes/indicadores'));
app.use('/api/mi-indicador', require('./routes/miIndicador'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/superadmin', require('./routes/superadmin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '💈 Barbería API funcionando', time: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint no encontrado' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 ENV: ${process.env.NODE_ENV}`);
});

module.exports = app;
