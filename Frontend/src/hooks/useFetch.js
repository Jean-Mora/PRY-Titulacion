import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carga datos con estado de carga, error y reintento.
 *
 *   const { data, error, loading, reload } = useFetch((signal) => api.list(params, { signal }), [params]);
 *
 * Cancela la petición anterior si cambian las dependencias o se desmonta.
 */
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef
      .current(controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState((s) => ({ ...s, error, loading: false }));
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
