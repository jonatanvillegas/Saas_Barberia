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
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : true; // true = refleja el Origin; útil en Vercel sin hardcodear dominios

app.use(cors({
  origin: corsOrigin,
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

// Serve frontend static files in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Fallback para SPA (cualquier ruta que no sea /api va al index.html)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint no encontrado' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Solo levantar HTTP server en modo "node src/app.js" (desarrollo/producción tradicional).
// En Vercel (serverless) el handler importa el app y NO debe hacer listen.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 ENV: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
