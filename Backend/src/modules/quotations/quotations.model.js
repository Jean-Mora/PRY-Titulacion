/**
 * Colección quotations — presupuestos armados desde el catálogo.
 *
 * Reglas (Arquitectura §5):
 *  - Estados: recibida → confirmada → vendida, o cancelada desde recibida o
 *    confirmada. vendida y cancelada son finales (STATUS_TRANSITIONS).
 *  - Los ítems copian nombre y precio al crearse, para que un cambio de precio
 *    posterior no altere presupuestos ya enviados.
 *  - El total se calcula a partir de los ítems.
 *
 * Índice: status + createdAt. code es único (p. ej. "COT-000123"; lo genera
 * quotations.service en el incremento 5).
 */
const { Schema, model } = require('mongoose');

const STATUSES = ['recibida', 'confirmada', 'vendida', 'cancelada'];

const STATUS_TRANSITIONS = Object.freeze({
  recibida: ['confirmada', 'cancelada'],
  confirmada: ['vendida', 'cancelada'],
  vendida: [],
  cancelada: [],
});

const itemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'La cantidad mínima es 1'],
      validate: { validator: Number.isInteger, message: 'La cantidad debe ser un número entero' },
    },
  },
  { _id: false },
);

const historySchema = new Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' }, // vacío si la creó un cliente desde el catálogo
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const quotationSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    customer: {
      name: { type: String, required: [true, 'El nombre del cliente es obligatorio'], trim: true, maxlength: 80 },
      phone: { type: String, required: [true, 'El teléfono del cliente es obligatorio'], trim: true, maxlength: 20 },
    },
    items: {
      type: [itemSchema],
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: 'La cotización necesita al menos un ítem' },
    },
    total: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: STATUSES, default: 'recibida' },
    history: { type: [historySchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false },
);

quotationSchema.index({ status: 1, createdAt: -1 });

quotationSchema.pre('validate', function computeTotal() {
  const cents = (this.items || []).reduce((sum, i) => sum + Math.round(i.price * 100) * i.quantity, 0);
  this.total = cents / 100;
  if (this.isNew && this.history.length === 0) {
    this.history.push({ status: this.status, userId: this.createdBy });
  }
});

/** true si se puede pasar de `from` a `to`. */
function canTransition(from, to) {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

module.exports = model('Quotation', quotationSchema);
Object.assign(module.exports, { STATUSES, STATUS_TRANSITIONS, canTransition });
