import { Link } from 'react-router';
import EmptyState from '../components/EmptyState.jsx';

export default function NotFoundPage() {
  return (
    <EmptyState
      icon="🧭"
      title="Página no encontrada"
      description="La dirección que buscas no existe o fue movida."
      action={
        <Link to="/" className="font-semibold text-brand-700 hover:underline">
          Ir al catálogo
        </Link>
      }
    />
  );
}
