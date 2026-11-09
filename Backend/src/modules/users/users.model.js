/**
 * Colección users — personal del panel (admin y vendedor).
 * Índice: email único.
 */
const { Schema, model } = require('mongoose');
const { ROLE_VALUES } = require('../../utils/roles');

const userSchema = new Schema(
  {
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      trim: true,
      lowercase: true,
      maxlength: 120,
      unique: true,
    },
    // Nunca se devuelve en consultas salvo que se pida con .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLE_VALUES, required: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

module.exports = model('User', userSchema);
