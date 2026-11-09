/**
 * Colección movements — kárdex de inventario. Es de solo inserción: un
 * movimiento nunca se edita ni se borra (por eso no tiene updatedAt).
 *
 * Reglas (Arquitectura §5):
 *  - El stock solo cambia por un movimiento (movements.service, incremento 3).
 *  - Cada movimiento guarda el stock resultante (stockAfter) para leer el
 *    kárdex sin recalcular.
 *
 * quantity:
 *  - entrada y salida: entero positivo (la dirección la da el tipo).
 *  - ajuste: entero distinto de 0 con signo (diferencia del conteo físico).
 *
 * Índice: productId + variantId + createdAt.
 */
const { Schema, model } = require('mongoose');

const TYPES = ['entrada', 'salida', 'ajuste'];
const REASONS = ['compra', 'venta', 'cotizacion', 'conteo'];

/** Motivos válidos para cada tipo de movimiento. */
const REASONS_BY_TYPE = Object.freeze({
  entrada: ['compra'],
  salida: ['venta', 'cotizacion'],
  ajuste: ['conteo'],
});

const movementSchema = new Schema(
  {
    type: { type: String, enum: TYPES, required: true },
    reason: { type: String, enum: REASONS, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    quantity: {
      type: Number,
      required: true,
      validate: { validator: Number.isInteger, message: 'La cantidad debe ser un número entero' },
    },
    stockAfter: { type: Number, required: true, min: [0, 'El stock no puede quedar negativo'] },
    // Documento que originó el movimiento (p. ej. quotationId o n.º de factura de compra).
    reference: { type: String, trim: true, default: '' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

movementSchema.index({ productId: 1, variantId: 1, createdAt: -1 });

movementSchema.pre('validate', function checkConsistency() {
  if (this.type && this.reason && !REASONS_BY_TYPE[this.type]?.includes(this.reason)) {
    this.invalidate('reason', `El motivo "${this.reason}" no corresponde a un movimiento de tipo ${this.type}`);
  }
  if (typeof this.quantity === 'number') {
    if (this.type === 'ajuste' && this.quantity === 0) {
      this.invalidate('quantity', 'Un ajuste no puede ser de 0 unidades');
    }
    if (this.type !== 'ajuste' && this.quantity <= 0) {
      this.invalidate('quantity', 'La cantidad debe ser mayor que 0');
    }
  }
});

module.exports = model('Movement', movementSchema);
Object.assign(module.exports, { TYPES, REASONS, REASONS_BY_TYPE });
