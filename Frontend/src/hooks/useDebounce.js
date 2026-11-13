import { useEffect, useState } from 'react';

/** Devuelve `value` recién cuando deja de cambiar durante `delay` ms (buscadores). */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
