import type { ToolName, Annotator as ImageAnnotator } from '@labelu/image';
import type { EnumerableAttribute, TextAttribute, ILabel } from '@labelu/interface';
import { createContext, useContext } from 'react';

import type { ImageAnnotatorOptions } from '../hooks/useImageAnnotator';

export interface GlobalToolConfig {
  tag?: EnumerableAttribute[];
  // 文本描述
  text?: TextAttribute[];
}

export interface ToolContextType {
  engine: ImageAnnotator;

  currentTool: ToolName | undefined;

  config?: ImageAnnotatorOptions;

  tools: ToolName[];

  selectedLabel: ILabel | undefined;

  onLabelChange: (label: ILabel) => void;

  globalToolConfig: GlobalToolConfig;

  labelMapping: Record<ToolName, Record<string, ILabel>>;

  labels: ILabel[];
}

export const ToolContext = createContext<ToolContextType>({} as ToolContextType);

export function useTool() {
  const contextValue = useContext(ToolContext);

  if (Object.keys(contextValue).length === 0) {
    throw new Error('useTool must be used within a ToolContext.Provider');
  }

  return contextValue;
}
