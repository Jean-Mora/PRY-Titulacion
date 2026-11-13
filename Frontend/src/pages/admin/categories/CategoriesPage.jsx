import { useState } from 'react';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../../../api/categories.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { fieldErrors } from '../../../utils/apiErrors.js';
import Alert from '../../../components/Alert.jsx';
import Button from '../../../components/Button.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Input from '../../../components/Input.jsx';
import Modal from '../../../components/Modal.jsx';
import Spinner from '../../../components/Spinner.jsx';
import Textarea from '../../../components/Textarea.jsx';

const EMPTY = { name: '', description: '' };

/**
 * /admin/categorias (solo admin): listar, crear, editar y eliminar categorías.
 * Una categoría con productos no se puede eliminar (el backend responde 409).
 */
export default function CategoriesPage() {
  const { data: categories, error, loading, reload } = useFetch((signal) => listCategories({ signal }), []);
  const [editing, setEditing] = useState(null); // null | 'new' | categoría
  const [toDelete, setToDelete] = useState(null);
  const [notice, setNotice] = useState('');

  const afterSave = (message) => {
    setEditing(null);
    setToDelete(null);
    setNotice(message);
    reload();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Categorías</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Agrupan los productos del catálogo.</p>
        </div>
        <Button onClick={() => { setNotice(''); setEditing('new'); }}>+ Nueva categoría</Button>
      </div>

      {notice && <Alert tone="success" className="mt-4">{notice}</Alert>}

      <div className="mt-6">
        {loading && !categories ? (
          <Spinner label="Cargando categorías…" />
        ) : error ? (
          <Alert>
            {error.message}{' '}
            <button type="button" className="font-semibold underline" onClick={reload}>Reintentar</button>
          </Alert>
        ) : categories.length === 0 ? (
          <EmptyState icon="🗂️" title="Aún no hay categorías" description="Crea la primera, por ejemplo “Útiles escolares” u “Oficina”." />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="hidden px-4 py-3 md:table-cell">Descripción</th>
                  <th scope="col" className="px-4 py-3 text-right">Productos</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">/categoria/{c.slug}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell dark:text-slate-400">{c.description || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{c.productCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setNotice(''); setEditing(c); }} aria-label={`Editar ${c.name}`}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setNotice(''); setToDelete(c); }} aria-label={`Eliminar ${c.name}`} className="text-red-600 dark:text-red-400">
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <CategoryFormModal
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(c, isNew) => afterSave(isNew ? `Categoría “${c.name}” creada.` : `Categoría “${c.name}” actualizada.`)}
        />
      )}
      {toDelete && (
        <DeleteCategoryModal category={toDelete} onClose={() => setToDelete(null)} onDeleted={() => afterSave(`Categoría “${toDelete.name}” eliminada.`)} />
      )}
    </div>
  );
}

function CategoryFormModal({ category, onClose, onSaved }) {
  const isNew = !category;
  const [form, setForm] = useState(isNew ? EMPTY : { name: category.name, description: category.description ?? '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = 'El nombre debe tener al menos 2 caracteres.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setServerError('');
    try {
      const body = { name: form.name.trim(), description: form.description.trim() };
      const saved = isNew ? await createCategory(body) : await updateCategory(category._id, body);
      onSaved(saved, isNew);
    } catch (err) {
      setErrors(fieldErrors(err));
      setServerError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={isNew ? 'Nueva categoría' : 'Editar categoría'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="category-form" loading={saving}>{isNew ? 'Crear' : 'Guardar cambios'}</Button>
        </>
      }
    >
      <form id="category-form" noValidate onSubmit={submit} className="space-y-4">
        {serverError && <Alert>{serverError}</Alert>}
        <Input label="Nombre" name="name" value={form.name} onChange={change} error={errors.name} maxLength={60} required />
        <Textarea label="Descripción (opcional)" name="description" value={form.description} onChange={change} error={errors.description} maxLength={300} />
        {!isNew && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            La dirección pública (/categoria/{category.slug}) se mantiene aunque cambies el nombre, para no romper enlaces compartidos.
          </p>
        )}
      </form>
    </Modal>
  );
}

function DeleteCategoryModal({ category, onClose, onDeleted }) {
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteCategory(category._id);
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
      title="Eliminar categoría"
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
        ¿Eliminar la categoría <strong>{category.name}</strong>? Esta acción no se puede deshacer.
      </p>
      {category.productCount > 0 && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Tiene {category.productCount} producto{category.productCount === 1 ? '' : 's'}: primero muévelos a otra categoría.
        </p>
      )}
    </Modal>
  );
}
