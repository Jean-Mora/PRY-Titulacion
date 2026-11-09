import EmptyState from '../../components/EmptyState.jsx';

/** Marcador para secciones del panel que se construyen en incrementos posteriores. */
export default function UpcomingPage({ section }) {
  return (
    <EmptyState
      icon={section.icon}
      title={section.label}
      description={
        section.increment
          ? `Esta sección se construye en el incremento ${section.increment} del plan.`
          : 'Esta sección se construye en un próximo incremento del plan.'
      }
    />
  );
}
