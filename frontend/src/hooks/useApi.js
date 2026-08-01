import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader and exposes loading / error / data as one object, so
 * every screen renders the same four states without repeating the plumbing.
 *
 * `deps` behaves like a useEffect dependency list.
 */
export function useApi(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const mounted = useRef(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (options = {}) => {
    if (!options.silent) setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await loaderRef.current();
      if (mounted.current) setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      if (mounted.current) setState({ data: null, error: error.message || 'Something went wrong', loading: false });
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: run, setData: (data) => setState((current) => ({ ...current, data })) };
}

/** Tracks a one-off action (save, submit, sync) with pending and error state. */
export function useAction(action) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const run = useCallback(
    async (...args) => {
      setPending(true);
      setError(null);
      setDone(false);
      try {
        const result = await action(...args);
        setDone(true);
        return result;
      } catch (caught) {
        setError(caught.message || 'Action failed');
        return null;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  return { run, pending, error, done, reset: () => { setError(null); setDone(false); } };
}
