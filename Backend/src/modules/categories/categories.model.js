/**
 * Colección categories. Índice: slug único.
 * Si no se envía slug, se genera a partir del nombre.
 * El CRUD (rutas, servicio, validación) se implementa en el incremento 2.
 */
const { Schema, model } = require('mongoose');
const { slugify } = require('../../utils/slugify');

const categorySchema = new Schema(
  {
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 60 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true, versionKey: false },
);

categorySchema.pre('validate', function setSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

module.exports = model('Category', categorySchema);
