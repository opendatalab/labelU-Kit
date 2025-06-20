import type { ToolName, Annotator as ImageAnnotator, EditType } from '@labelu/image';
import type { EnumerableAttribute, TextAttribute, ILabel, Attribute } from '@labelu/interface';
import type { RefObject } from 'react';
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

  memorizeToolLabel: RefObject<Record<ToolName, Attribute>>;

  config?: ImageAnnotatorOptions;

  tools: ToolName[];

  selectedLabel: ILabel | undefined;

  onLabelChange: (label: ILabel) => void;

  globalToolConfig: GlobalToolConfig;

  labelMapping: Record<ToolName, Record<string, ILabel>>;

  requestEdit?: (type: EditType, payload: { toolName: ToolName; label?: string; modifiedProperty?: string }) => boolean;

  preLabelMapping: Record<ToolName | 'text' | 'tag', Record<string, ILabel | TextAttribute | EnumerableAttribute>>;

  labels: ILabel[];

  attributeModalOpen?: boolean;

  setAttributeModalOpen: (open: boolean) => void;
}

export const ToolContext = createContext<ToolContextType>({} as ToolContextType);

export function useTool() {
  const contextValue = useContext(ToolContext);

  if (Object.keys(contextValue).length === 0) {
    throw new Error('useTool must be used within a ToolContext.Provider');
  }

  return contextValue;
}
