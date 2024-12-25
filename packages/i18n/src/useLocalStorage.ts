import { useEffect, useState } from 'react';

export const useLocalStorage = (key: string, value: any) => {
  const [state, setState] = useState<any>(() => {
    try {
      const localStorageValue = localStorage.getItem(key);
      if (typeof localStorageValue !== 'string') {
        localStorage.setItem(key, JSON.stringify(value));
        return value;
      } else {
        return JSON.parse(localStorageValue);
      }
    } catch (_unused) {
      return value;
    }
  });
  useEffect(() => {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(key, serializedState);
    } catch (_unused2) {
    }
  });
  return [state, setState];
};
