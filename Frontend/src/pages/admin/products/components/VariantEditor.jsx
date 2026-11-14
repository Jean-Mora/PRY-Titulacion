import Button from '../../../../components/Button.jsx';

let nextKey = 0;
/** Fila nueva del editor (aún sin _id ni stock). */
export function newVariantRow(sku = '') {
  nextKey += 1;
  return { key: `nueva-${nextKey}`, sku, color: '', size: '', model: '', stock: 0 };
}

/** Convierte las variantes del backend en filas editables. */
export function toVariantRows(variants = []) {
  return variants.map((v) => ({ key: v._id, _id: v._id, sku: v.sku, color: v.color ?? '', size: v.size ?? '', model: v.model ?? '', stock: v.stock ?? 0 }));
}

/** Filas → cuerpo para la API (sin stock: el stock solo cambia por movimientos). */
export function toVariantPayload(rows) {
  return rows.map(({ _id, sku, color, size, model }) => ({
    ...(_id ? { _id } : {}),
    sku: sku.trim().toUpperCase(),
    color: color.trim(),
    size: size.trim(),
    model: model.trim(),
  }));
}

const cell =
  'block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900';

/**
 * Editor de variantes (color, tamaño, modelo) de un producto.
 * - El stock se muestra pero no se edita aquí.
 * - Una variante con stock no se puede quitar (el backend también lo impide).
 * - Sin variantes, el backend crea la variante "Única" con el SKU del producto.
 */
export default function VariantEditor({ rows, onChange, productSku, errors = {} }) {
  const update = (key, field, value) => onChange(rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  const remove = (key) => onChange(rows.filter((r) => r.key !== key));
  const add = () => {
    const base = (productSku || '').trim().toUpperCase();
    onChange([...rows, newVariantRow(base ? `${base}-${rows.length + 1}` : '')]);
  };

  return (
    <fieldset className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <legend className="sr-only">Variantes</legend>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Variantes</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Color, tamaño o modelo. El stock se registra con movimientos de inventario.</p>
        </div>
        <Button variant="secondary" size="sm" icon="plus" onClick={add}>Agregar variante</Button>
      </div>

      {errors.variants && <p className="px-4 pt-3 text-sm text-red-600 dark:text-red-400">{errors.variants}</p>}

      {rows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
          Sin variantes: se creará la variante <strong>“Única”</strong> con el SKU del producto.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 pb-1 pt-3">SKU</th>
                <th scope="col" className="px-2 pb-1 pt-3">Color</th>
                <th scope="col" className="px-2 pb-1 pt-3">Tamaño</th>
                <th scope="col" className="px-2 pb-1 pt-3">Modelo</th>
                <th scope="col" className="px-2 pb-1 pt-3 text-right">Stock</th>
                <th scope="col" className="px-4 pb-1 pt-3"><span className="sr-only">Quitar</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key}>
                  <td className="px-4 py-1.5">
                    <input aria-label={`SKU de la variante ${i + 1}`} className={`${cell} uppercase`} value={r.sku} maxLength={40} onChange={(e) => update(r.key, 'sku', e.target.value)} />
                    {errors[`variants.${i}.sku`] && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[`variants.${i}.sku`]}</p>}
                  </td>
                  <td className="px-2 py-1.5"><input aria-label={`Color de la variante ${i + 1}`} className={cell} value={r.color} maxLength={40} onChange={(e) => update(r.key, 'color', e.target.value)} /></td>
                  <td className="px-2 py-1.5"><input aria-label={`Tamaño de la variante ${i + 1}`} className={cell} value={r.size} maxLength={40} onChange={(e) => update(r.key, 'size', e.target.value)} /></td>
                  <td className="px-2 py-1.5"><input aria-label={`Modelo de la variante ${i + 1}`} className={cell} value={r.model} maxLength={40} onChange={(e) => update(r.key, 'model', e.target.value)} /></td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{r.stock}</td>
                  <td className="px-4 py-1.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="trash"
                      onClick={() => remove(r.key)}
                      disabled={r.stock > 0}
                      title={r.stock > 0 ? 'Tiene stock: registra un ajuste a 0 antes de quitarla' : undefined}
                      aria-label={`Quitar variante ${i + 1}`}
                    >
                      Quitar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </fieldset>
  );
}
