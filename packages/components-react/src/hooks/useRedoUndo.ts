import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface RedoUndoOptions<T> {
  maxHistory?: number;
  onUndo?: (currentValue: T) => void;
  onRedo?: (currentValue: T) => void;
}

export interface RedoUndoState<T> {
  value: T;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  futureLength: number;
}

export function useRedoUndo<T>(initialValue: T, options: RedoUndoOptions<T>) {
  const [state, setState] = useState<RedoUndoState<T>>({
    value: initialValue,
    canUndo: false,
    canRedo: false,
    historyLength: 0,
    futureLength: 0,
  });

  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const skippedHistories = useRef<Set<T>>(new Set());

  const finalOptions = useMemo<Required<RedoUndoOptions<T>>>(() => {
    return {
      maxHistory: 20,
      onUndo: () => {},
      onRedo: () => {},
      ...(options ?? {}),
    };
  }, [options]);

  const updateState = useCallback((newValue: T) => {
    setState((prev) => ({
      ...prev,
      value: newValue,
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
      historyLength: pastRef.current.length,
      futureLength: futureRef.current.length,
    }));
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;

    const newPresent = futureRef.current[0];
    const newFuture = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, state.value].slice(-finalOptions.maxHistory);

    futureRef.current = newFuture;
    updateState(newPresent);
    finalOptions.onRedo(newPresent);
  }, [state.value, finalOptions, updateState]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;

    const newPresent = pastRef.current[pastRef.current.length - 1];
    const newPast = pastRef.current.slice(0, -1);

    pastRef.current = newPast;
    futureRef.current = [state.value, ...futureRef.current].slice(0, finalOptions.maxHistory);
    updateState(newPresent);
    finalOptions.onUndo(newPresent);
  }, [state.value, finalOptions, updateState]);

  const reset = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    skippedHistories.current.clear();
    updateState(initialValue);
  }, [initialValue, updateState]);

  useEffect(() => {
    reset();
  }, [initialValue, reset]);

  const update = useCallback(
    (value: React.SetStateAction<T>, skip = false) => {
      setState((prev) => {
        const newValue = typeof value === 'function' ? (value as Function)(prev.value) : value;

        if (skip) {
          skippedHistories.current.add(newValue);
        }

        if (!skippedHistories.current.has(prev.value)) {
          pastRef.current = [...pastRef.current, prev.value].slice(-finalOptions.maxHistory);
        }

        futureRef.current = [];
        return {
          ...prev,
          value: newValue,
          canUndo: pastRef.current.length > 0,
          canRedo: false,
          historyLength: pastRef.current.length,
          futureLength: 0,
        };
      });
    },
    [finalOptions.maxHistory],
  );

  const clearSkippedHistories = useCallback(() => {
    skippedHistories.current.clear();
  }, []);

  return [
    state.value,
    update,
    redo,
    undo,
    pastRef,
    futureRef,
    reset,
    clearSkippedHistories,
    state.canUndo,
    state.canRedo,
    state.historyLength,
    state.futureLength,
  ] as const;
}
