import { useEffect } from 'react';

type Callback = () => Promise<any>;

type Deps = readonly any[];

/**
 * hook that wraps a callback function inside
 * useEffect hook, triggered everytime dependencies change
 * @param callback callback
 * @param deps dependences
 */
export default function useAsyncEffect(callback: Callback, deps: Deps = []) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    callback().catch((e) => console.error('useAsyncEffect error:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
