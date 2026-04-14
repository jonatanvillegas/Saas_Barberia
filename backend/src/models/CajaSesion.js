const mongoose = require('mongoose');

const cajaSesionSchema = new mongoose.Schema({
  barberia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barberia',
    required: true,
  },
  usuarioApertura: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  usuarioCierre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  montoApertura: {
    type: Number,
    required: [true, 'El monto de apertura es obligatorio'],
    min: [0, 'El monto no puede ser negativo'],
  },
  montoCierre: {
    type: Number,
  },
  ingresosEsperados: {
    type: Number,
    default: 0,
  },
  egresosEsperados: {
    type: Number,
    default: 0,
  },
  estado: {
    type: String,
    enum: ['abierta', 'cerrada'],
    default: 'abierta',
  },
  fechaApertura: {
    type: Date,
    default: Date.now,
  },
  fechaCierre: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('CajaSesion', cajaSesionSchema);
