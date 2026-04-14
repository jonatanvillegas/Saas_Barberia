const mongoose = require('mongoose');

const barberiaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la barbería es requerido'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  direccion: { type: String, trim: true },
  telefono: { type: String, trim: true },
  logo: { type: String, default: null },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Barberia', barberiaSchema);
