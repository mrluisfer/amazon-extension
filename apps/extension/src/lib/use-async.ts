import { type DependencyList, useCallback, useEffect, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

/** Minimal async loader with stale-response protection and manual reload. */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: caller controls deps
  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    fn().then(
      (data) => active && setState({ status: 'success', data }),
      (error: unknown) =>
        active &&
        setState({
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        }),
    );
    return () => {
      active = false;
    };
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return [state, reload] as const;
}
