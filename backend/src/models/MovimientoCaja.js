const mongoose = require('mongoose');

const movimientoCajaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['ingreso', 'egreso'],
    required: [true, 'El tipo es requerido'],
  },
  categoria: {
    type: String,
    trim: true,
    default: 'General',
  },
  monto: {
    type: Number,
    required: [true, 'El monto es requerido'],
    min: [0.01, 'El monto debe ser mayor a 0'],
  },
  descripcion: { type: String, trim: true },
  fecha: { type: Date, default: Date.now },
  // Referencia al pago si el ingreso viene de un corte
  pago: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pago',
    default: null,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  barberia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barberia',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('MovimientoCaja', movimientoCajaSchema);
