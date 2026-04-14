const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: 6,
    select: false,
  },
  rol: {
    type: String,
    enum: ['superadmin', 'admin', 'barbero', 'caja'],
    default: 'caja',
  },
  activo: { type: Boolean, default: true },
  barberia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barberia',
    required: function () {
      return this.rol !== 'superadmin';
    },
    default: null,
  },
  colaborador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Colaborador',
    default: null
  }
}, { timestamps: true });

// Índice compuesto: email único por barbería (permite superadmins nulos separadamente)
usuarioSchema.index({ email: 1, barberia: 1 }, { unique: true });

// Hash password before save (Mongoose 8: async hooks no usan next)
usuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
usuarioSchema.methods.compararPassword = async function (candidato) {
  return await bcrypt.compare(candidato, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
