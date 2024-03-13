import { createContext, useContext } from 'react';

import type { AllAnnotationMapping } from './annotation.context';

export interface HistoryContextType {
  redo: () => void;
  undo: () => void;
  pastRef: React.RefObject<AllAnnotationMapping[]>;
  futureRef: React.RefObject<AllAnnotationMapping[]>;
}

export const HistoryContext = createContext<HistoryContextType>({} as HistoryContextType);

export function useHistoryCtx() {
  const contextValue = useContext(HistoryContext);

  if (Object.keys(contextValue).length === 0) {
    throw new Error('useHistoryCtx must be used within a HistoryContext.Provider');
  }

  return contextValue;
}
