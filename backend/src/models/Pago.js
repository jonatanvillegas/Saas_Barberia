const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  colaborador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Colaborador',
    required: [true, 'El barbero es requerido'],
  },
  tipoServicio: { type: String, trim: true, default: 'Corte' },
  montoServicio: {
    type: Number,
    required: [true, 'El monto del servicio es requerido'],
    min: [0.01, 'El monto debe ser mayor a 0'],
  },
  montoPagado: {
    type: Number,
    required: [true, 'El monto pagado es requerido'],
    min: [0, 'El monto pagado no puede ser negativo'],
  },
  vuelto: { type: Number, default: 0 },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta', 'otro'],
    default: 'efectivo',
  },
  usuarioRegistro: {
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

// Calcular vuelto automáticamente antes de guardar (Mongoose 8: sin next)
pagoSchema.pre('save', function () {
  this.vuelto = this.montoPagado - this.montoServicio;
  if (this.vuelto < 0) this.vuelto = 0;
});

module.exports = mongoose.model('Pago', pagoSchema);
