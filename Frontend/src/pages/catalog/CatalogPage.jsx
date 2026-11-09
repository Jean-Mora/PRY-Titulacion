import { useParams } from 'react-router';
import EmptyState from '../../components/EmptyState.jsx';

/**
 * Catálogo público (/ y /categoria/:slug).
 * Incremento 1: solo la página dentro de PublicLayout.
 * Incremento 4: cuadrícula de productos, búsqueda con debounce, filtros en la URL y stock en vivo.
 */
export default function CatalogPage() {
  const { slug } = useParams();
  return (
    <EmptyState
      icon="📚"
      title={slug ? `Categoría: ${slug}` : 'Catálogo de útiles y suministros'}
      description="El catálogo digital con búsqueda, filtros y stock en vivo estará disponible muy pronto."
    />
  );
}
