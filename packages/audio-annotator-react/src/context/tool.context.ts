import type { EditType } from '@labelu/components-react';
import type { EnumerableAttribute, TextAttribute, ILabel, MediaAnnotationType } from '@labelu/interface';
import { createContext, useContext } from 'react';

import type { MediaAnnotatorConfig } from './sample.context';

export interface GlobalToolConfig {
  tag?: EnumerableAttribute[];
  // 文本描述
  text?: TextAttribute[];
}

export interface ToolContextType {
  player: {
    getCurrentTime: () => number;

    setCurrentTime: (time: number) => void;

    getDuration: () => number;

    pause: () => void;

    play: () => void;
  };

  currentTool: MediaAnnotationType | undefined;

  onAttributeChange: (payload: Record<string, string | string[]>) => void;

  config?: MediaAnnotatorConfig;

  tools: MediaAnnotationType[];

  containerRef: React.RefObject<HTMLDivElement>;

  onToolChange: (tool?: MediaAnnotationType) => void;

  selectedLabel: ILabel | undefined;

  onLabelChange: (label: ILabel) => void;

  globalToolConfig: GlobalToolConfig;

  labelMapping: Record<MediaAnnotationType, Record<string, ILabel>>;

  requestEdit?: (
    type: EditType,
    payload: { toolName: MediaAnnotationType; label?: string; modifiedProperty?: string },
  ) => boolean;

  preLabelMapping: Record<
    MediaAnnotationType | 'text' | 'tag',
    Record<string, ILabel | TextAttribute | EnumerableAttribute>
  >;

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
