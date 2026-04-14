const mongoose = require('mongoose');

const colaboradorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del colaborador es requerido'],
    trim: true,
  },
  telefono: { type: String, trim: true },
  estado: { type: Boolean, default: true },
  tipoPago: {
    type: String,
    enum: ['porcentaje', 'fijo'],
    required: [true, 'El tipo de pago es requerido'],
    default: 'porcentaje',
  },
  porcentaje: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
  },
  salarioFijo: {
    type: Number,
    min: 0,
    default: 0,
  },
  barberia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barberia',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Colaborador', colaboradorSchema);
