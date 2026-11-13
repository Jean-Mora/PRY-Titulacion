import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { listCategories } from '../../../api/categories.js';
import { deleteProduct, listProducts } from '../../../api/products.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { formatUSD } from '../../../utils/format.js';
import { ROLES } from '../../../utils/roles.js';
import Alert from '../../../components/Alert.jsx';
import Badge from '../../../components/Badge.jsx';
import Button from '../../../components/Button.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Input from '../../../components/Input.jsx';
import Modal from '../../../components/Modal.jsx';
import Pagination from '../../../components/Pagination.jsx';
import Select from '../../../components/Select.jsx';
import Spinner from '../../../components/Spinner.jsx';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

/** Etiqueta de stock: Agotado, Stock bajo (≤ mínimo) o la cantidad. */
export function StockBadge({ stock, stockMin }) {
  if (stock <= 0) return <Badge tone="danger">Agotado</Badge>;
  if (stockMin > 0 && stock <= stockMin) return <Badge tone="warning">{stock} · bajo</Badge>;
  return <span className="tabular-nums text-slate-700 dark:text-slate-300">{stock}</span>;
}

/**
 * /admin/productos — listado interno con stock y costo.
 * Admin: crea, edita y elimina. Vendedor: solo consulta.
 * Los filtros viven en la URL (?q=&categoria=&estado=&pagina=) para poder
 * volver atrás o compartir el enlace.
 */
export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user.role === ROLES.ADMIN;
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('pagina')) || 1;
  const categoryId = params.get('categoria') ?? '';
  const active = params.get('estado') ?? '';

  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebounce(search.trim(), 300);

  const [toDelete, setToDelete] = useState(null);
  // Mensaje que deja el formulario al volver ("Producto … creado").
  const location = useLocation();
  const [notice, setNotice] = useState(location.state?.notice ?? '');

  const updateParams = (changes) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) {
          if (v === '' || v === undefined || v === null || (k === 'pagina' && v === 1)) next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      },
      { replace: true },
    );
  };

  // La búsqueda (ya con espera) se refleja en la URL y vuelve a la página 1.
  useEffect(() => {
    if ((params.get('q') ?? '') !== q) updateParams({ q, pagina: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const { data: categories } = useFetch((signal) => listCategories({ signal }), []);
  const { data, error, loading, reload } = useFetch(
    (signal) => listProducts({ page, limit: PAGE_SIZE, q: params.get('q') ?? '', categoryId, active }, { signal }),
    [page, params.get('q'), categoryId, active],
  );

  const categoryOptions = (categories ?? []).map((c) => ({ value: c._id, label: c.name }));
  const hasFilters = Boolean(params.get('q') || categoryId || active);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Productos</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {isAdmin ? 'Productos, variantes y precios del catálogo.' : 'Consulta de productos, precios y stock.'}
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin/productos/nuevo"
            className="inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            + Nuevo producto
          </Link>
        )}
      </div>

      {notice && <Alert tone="success" className="mt-4">{notice}</Alert>}

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_200px_160px]">
        <Input
          label="Buscar"
          type="search"
          placeholder="Nombre o SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="Categoría"
          placeholder="Todas"
          options={categoryOptions}
          value={categoryId}
          onChange={(e) => updateParams({ categoria: e.target.value, pagina: 1 })}
        />
        <Select
          label="Estado"
          placeholder="Todos"
          options={STATUS_OPTIONS}
          value={active}
          onChange={(e) => updateParams({ estado: e.target.value, pagina: 1 })}
        />
      </div>

      <div className="mt-4">
        {loading && !data ? (
          <Spinner label="Cargando productos…" />
        ) : error ? (
          <Alert>
            {error.message}{' '}
            <button type="button" className="font-semibold underline" onClick={reload}>Reintentar</button>
          </Alert>
        ) : data.items.length === 0 ? (
          <EmptyState
            icon="📦"
            title={hasFilters ? 'Sin resultados' : 'Aún no hay productos'}
            description={hasFilters ? 'Prueba con otra búsqueda o quita los filtros.' : isAdmin ? 'Crea el primer producto del catálogo.' : undefined}
          />
        ) : (
          <>
            <div className={`overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-3">Producto</th>
                    <th scope="col" className="px-4 py-3">Categoría</th>
                    <th scope="col" className="px-4 py-3 text-right">Precio</th>
                    <th scope="col" className="px-4 py-3 text-right">Costo</th>
                    <th scope="col" className="px-4 py-3 text-right">Stock</th>
                    <th scope="col" className="px-4 py-3">Estado</th>
                    {isAdmin && <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.items.map((p) => (
                    <tr key={p._id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {isAdmin ? (
                            <Link to={`/admin/productos/${p._id}`} className="hover:text-brand-700 hover:underline dark:hover:text-brand-300">{p.name}</Link>
                          ) : (
                            p.name
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {p.sku} · {p.variants.length} variante{p.variants.length === 1 ? '' : 's'}
                          {p.tags?.includes('nuevo') && <Badge tone="brand" className="ml-2">Nuevo</Badge>}
                          {p.tags?.includes('oferta') && <Badge tone="warning" className="ml-2">Oferta</Badge>}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-900 dark:text-slate-100">{formatUSD(p.price)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{formatUSD(p.cost)}</td>
                      <td className="px-4 py-3 text-right"><StockBadge stock={p.stock} stockMin={p.stockMin} /></td>
                      <td className="px-4 py-3">{p.active ? <Badge tone="success">Activo</Badge> : <Badge>Inactivo</Badge>}</td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Link
                              to={`/admin/productos/${p._id}`}
                              aria-label={`Editar ${p.name}`}
                              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              Editar
                            </Link>
                            <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400" aria-label={`Eliminar ${p.name}`} onClick={() => { setNotice(''); setToDelete(p); }}>
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Pagination page={data.page} pages={data.pages} total={data.total} onChange={(p) => updateParams({ pagina: p })} />
            </div>
          </>
        )}
      </div>

      {toDelete && (
        <DeleteProductModal
          product={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={() => {
            setNotice(`Producto “${toDelete.name}” eliminado.`);
            setToDelete(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function DeleteProductModal({ product, onClose, onDeleted }) {
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteProduct(product._id);
      onDeleted();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <Modal
      open
      size="sm"
      title="Eliminar producto"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={confirm} loading={deleting}>Eliminar</Button>
        </>
      }
    >
      {error && <Alert className="mb-3">{error}</Alert>}
      <p className="text-sm text-slate-700 dark:text-slate-300">
        ¿Eliminar <strong>{product.name}</strong> ({product.sku})? Esta acción no se puede deshacer.
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Si el producto tiene stock o movimientos no se podrá eliminar; en ese caso desactívalo para ocultarlo del catálogo.
      </p>
    </Modal>
  );
}
