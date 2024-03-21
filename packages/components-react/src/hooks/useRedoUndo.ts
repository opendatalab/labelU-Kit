import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface RedoUndoOptions<T> {
  maxHistory?: number;
  onUndo?: (currentValue: T) => void;
  onRedo?: (currentValue: T) => void;
}

export function useRedoUndo<T>(initialValue: T, options: RedoUndoOptions<T>) {
  const [currentValue, setCurrentValue] = useState<T>(initialValue);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const finalOptions = useMemo<RedoUndoOptions<T>>(() => {
    return {
      maxHistory: 20,
      ...options,
    };
  }, [options]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) {
      return;
    }

    const newPresent = futureRef.current[0];
    const newFuture = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, currentValue].slice(-finalOptions.maxHistory!);

    setCurrentValue(newPresent);
    futureRef.current = newFuture;

    if (finalOptions.onRedo) {
      finalOptions.onRedo(newPresent);
    }
  }, [currentValue, finalOptions]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) {
      return;
    }

    const newPresent = pastRef.current[pastRef.current.length - 1];
    const newPast = pastRef.current.slice(0, pastRef.current.length - 1);

    pastRef.current = newPast;
    setCurrentValue(newPresent);

    if (currentValue) {
      futureRef.current = [currentValue, ...futureRef.current].slice(0, finalOptions.maxHistory!);
    }

    if (finalOptions.onUndo) {
      finalOptions.onUndo(newPresent);
    }
  }, [currentValue, finalOptions]);

  const reset = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
  }, []);

  useEffect(() => {
    reset();
    setCurrentValue(initialValue);
  }, [initialValue, reset]);

  const update = useCallback(
    (value: React.SetStateAction<T | undefined>) => {
      setCurrentValue((pre) => {
        const newValue = typeof value === 'function' ? (value as Function)(pre) : value;

        if (pre) {
          pastRef.current = [...pastRef.current, pre].slice(-finalOptions.maxHistory!);
        }

        return newValue;
      });

      futureRef.current = [];
    },
    [finalOptions.maxHistory],
  );

  return [currentValue, update, redo, undo, pastRef, futureRef, reset] as const;
}
