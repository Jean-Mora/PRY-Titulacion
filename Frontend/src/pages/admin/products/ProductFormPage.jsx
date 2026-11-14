import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { listCategories } from '../../../api/categories.js';
import { createProduct, getProduct, updateProduct } from '../../../api/products.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { fieldErrors } from '../../../utils/apiErrors.js';
import Alert from '../../../components/Alert.jsx';
import Button from '../../../components/Button.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import Select from '../../../components/Select.jsx';
import Spinner from '../../../components/Spinner.jsx';
import Textarea from '../../../components/Textarea.jsx';
import VariantEditor, { toVariantPayload, toVariantRows } from './components/VariantEditor.jsx';

const EMPTY = { sku: '', name: '', categoryId: '', price: '', cost: '', stockMin: '0', description: '', tags: [], active: true };
const TAG_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'oferta', label: 'Oferta' },
];
const SKU_RE = /^[A-Z0-9][A-Z0-9._-]*$/;
const MONEY_RE = /^\d+(\.\d{1,2})?$/;

function toForm(p) {
  return {
    sku: p.sku,
    name: p.name,
    categoryId: p.categoryId,
    price: String(p.price),
    cost: String(p.cost ?? 0),
    stockMin: String(p.stockMin ?? 0),
    description: p.description ?? '',
    tags: p.tags ?? [],
    active: p.active,
  };
}

function validate(form, rows) {
  const e = {};
  const sku = form.sku.trim().toUpperCase();
  if (sku.length < 2) e.sku = 'El SKU debe tener al menos 2 caracteres.';
  else if (!SKU_RE.test(sku)) e.sku = 'Solo letras, números, punto, guion y guion bajo.';
  if (form.name.trim().length < 2) e.name = 'El nombre debe tener al menos 2 caracteres.';
  if (!form.categoryId) e.categoryId = 'Elige una categoría.';
  if (!MONEY_RE.test(form.price.trim())) e.price = 'Ingresa un precio válido (ej. 1.50).';
  if (form.cost.trim() && !MONEY_RE.test(form.cost.trim())) e.cost = 'Ingresa un costo válido (ej. 0.90).';
  if (!/^\d+$/.test(form.stockMin.trim())) e.stockMin = 'Debe ser un número entero, 0 o mayor.';

  const skus = rows.map((r) => r.sku.trim().toUpperCase());
  rows.forEach((r, i) => {
    if (!SKU_RE.test(skus[i]) || skus[i].length < 2) e[`variants.${i}.sku`] = 'SKU inválido.';
  });
  if (new Set(skus).size !== skus.length) e.variants = 'Hay SKUs de variante repetidos.';
  return e;
}

/**
 * /admin/productos/nuevo y /admin/productos/:id (solo admin).
 * Datos generales + variantes. El stock no se edita aquí.
 */
export default function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const { data: categories, loading: loadingCategories } = useFetch((signal) => listCategories({ signal }), []);
  const [form, setForm] = useState(EMPTY);
  const [rows, setRows] = useState([]);
  const [loadState, setLoadState] = useState(isNew ? 'ready' : 'loading');
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return undefined;
    const controller = new AbortController();
    getProduct(id, { signal: controller.signal })
      .then((p) => {
        setForm(toForm(p));
        setRows(toVariantRows(p.variants));
        setLoadState('ready');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setLoadError(err.status === 404 ? 'El producto no existe o fue eliminado.' : err.message);
        setLoadState('error');
      });
    return () => controller.abort();
  }, [id, isNew]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const toggleTag = (tag) =>
    setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }));

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    const found = validate(form, rows);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setServerError('Revisa los campos marcados.');
      return;
    }

    const body = {
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      categoryId: form.categoryId,
      price: Number(form.price),
      cost: form.cost.trim() ? Number(form.cost) : 0,
      stockMin: Number(form.stockMin),
      description: form.description.trim(),
      tags: form.tags,
      active: form.active,
      variants: toVariantPayload(rows),
    };

    setSaving(true);
    try {
      const saved = isNew ? await createProduct(body) : await updateProduct(id, body);
      navigate('/admin/productos', { state: { notice: `Producto “${saved.name}” ${isNew ? 'creado' : 'guardado'}.` } });
    } catch (err) {
      setErrors(fieldErrors(err));
      setServerError(err.message);
      setSaving(false);
    }
  };

  if (loadState === 'loading') return <Spinner label="Cargando producto…" />;
  if (loadState === 'error') {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert>{loadError}</Alert>
        <Link to="/admin/productos" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Volver a productos
        </Link>
      </div>
    );
  }

  const categoryOptions = (categories ?? []).map((c) => ({ value: c._id, label: c.name }));

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/productos" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
        <Icon name="arrowLeft" className="h-4 w-4" />
        Productos
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{isNew ? 'Nuevo producto' : form.name || 'Editar producto'}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {isNew ? 'Completa los datos generales y, si aplica, sus variantes.' : 'Edita los datos generales y las variantes. El stock se cambia con movimientos de inventario.'}
      </p>

      <form noValidate onSubmit={submit} className="mt-6 space-y-6">
        {serverError && <Alert>{serverError}</Alert>}

        <section aria-labelledby="datos-title" className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 id="datos-title" className="border-b border-slate-200 px-5 py-3 font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">Datos generales</h2>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Input label="SKU" name="sku" value={form.sku} onChange={change} error={errors.sku} maxLength={40} className="sm:col-span-1" inputMode="text" autoCapitalize="characters" hint="Código interno, p. ej. CUA-100." />
          <Input label="Nombre" name="name" value={form.name} onChange={change} error={errors.name} maxLength={120} />
          <div>
            <Select
              label="Categoría"
              name="categoryId"
              placeholder={loadingCategories ? 'Cargando…' : 'Elige una categoría'}
              options={categoryOptions}
              value={form.categoryId}
              onChange={change}
              error={errors.categoryId}
            />
            {!loadingCategories && categoryOptions.length === 0 && (
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                No hay categorías. <Link to="/admin/categorias" className="font-semibold text-brand-700 underline dark:text-brand-400">Crea una primero</Link>.
              </p>
            )}
          </div>
          <Input label="Stock mínimo" name="stockMin" type="number" min="0" step="1" inputMode="numeric" value={form.stockMin} onChange={change} error={errors.stockMin} hint="Avisa cuando el stock llegue a este número." />
          <Input label="Precio de venta (USD)" name="price" type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={change} error={errors.price} />
          <Input label="Costo (USD)" name="cost" type="number" min="0" step="0.01" inputMode="decimal" value={form.cost} onChange={change} error={errors.cost} hint="No se muestra en el catálogo público." />
          <Textarea label="Descripción" name="description" value={form.description} onChange={change} error={errors.description} maxLength={2000} className="sm:col-span-2" />

          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Etiquetas y estado</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {TAG_OPTIONS.map((t) => (
                <label key={t.value} className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-700 dark:border-slate-600" checked={form.tags.includes(t.value)} onChange={() => toggleTag(t.value)} />
                  {t.label}
                </label>
              ))}
              <label className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" name="active" className="h-4 w-4 rounded border-slate-300 accent-brand-700 dark:border-slate-600" checked={form.active} onChange={change} />
                Activo (visible en el catálogo)
              </label>
            </div>
          </fieldset>
          </div>
        </section>

        <VariantEditor rows={rows} onChange={(next) => { setRows(next); setErrors((errs) => ({ ...errs, variants: undefined })); }} productSku={form.sku} errors={errors} />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to="/admin/productos" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors duration-150 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800">
            Cancelar
          </Link>
          <Button type="submit" loading={saving}>{isNew ? 'Crear producto' : 'Guardar cambios'}</Button>
        </div>
      </form>
    </div>
  );
}
