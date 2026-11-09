/**
 * Colección products, con sus variantes embebidas.
 *
 * Reglas de negocio (Arquitectura §5):
 *  - El stock vive en la variante. Todo producto tiene al menos una variante;
 *    si se crea sin variantes, se agrega una "Única" automáticamente.
 *  - El stock del producto es la suma de sus variantes y se CALCULA (virtual
 *    `stock`), no se guarda.
 *  - El stock de una variante solo cambia por un movimiento (movements.service,
 *    incremento 3), nunca editando el producto.
 *
 * Índices: categoryId; texto en name; variants.sku. Además sku y slug únicos
 * (slug lo usa GET /api/catalog/:slug).
 */
const { Schema, model } = require('mongoose');
const { slugify } = require('../../utils/slugify');

const TAGS = ['nuevo', 'oferta'];

const variantSchema = new Schema(
  {
    sku: { type: String, required: [true, 'El SKU de la variante es obligatorio'], trim: true, uppercase: true },
    color: { type: String, trim: true, default: '' },
    size: { type: String, trim: true, default: '' },
    model: { type: String, trim: true, default: '' },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
      validate: { validator: Number.isInteger, message: 'El stock debe ser un número entero' },
    },
  },
  { _id: true },
);

/** Nombre legible de la variante: "Azul · A4" o "Única". */
variantSchema.virtual('label').get(function label() {
  const parts = [this.color, this.size, this.model].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Única';
});

const productSchema = new Schema(
  {
    sku: { type: String, required: [true, 'El SKU es obligatorio'], trim: true, uppercase: true, unique: true },
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: [true, 'La categoría es obligatoria'] },
    price: { type: Number, required: [true, 'El precio es obligatorio'], min: [0, 'El precio no puede ser negativo'] },
    cost: { type: Number, min: [0, 'El costo no puede ser negativo'], default: 0 },
    imageUrl: { type: String, trim: true, default: '' },
    tags: { type: [{ type: String, enum: TAGS }], default: [] },
    stockMin: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
    variants: {
      type: [variantSchema],
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: 'El producto necesita al menos una variante' },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.index({ categoryId: 1 });
productSchema.index({ name: 'text' }, { default_language: 'spanish' });
productSchema.index({ 'variants.sku': 1 });

/** Stock total = suma de las variantes (calculado, no se guarda). */
productSchema.virtual('stock').get(function totalStock() {
  return (this.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
});

productSchema.pre('validate', function defaults() {
  if (!this.slug && this.name) this.slug = slugify(`${this.name}-${this.sku || ''}`);
  if (!this.variants || this.variants.length === 0) {
    // Variante "Única": sin color, tamaño ni modelo; hereda el SKU del producto.
    this.variants = [{ sku: this.sku }];
  }
});

module.exports = model('Product', productSchema);
module.exports.TAGS = TAGS;
