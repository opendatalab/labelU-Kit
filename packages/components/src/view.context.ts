import type { Dispatch, SetStateAction } from 'react';
import React from 'react';
import type {
  AnnotationEngine,
  Attribute,
  EToolName,
  BasicConfig,
  InnerAttribute,
  LabelUAnnotationConfig,
  TextConfig,
} from '@labelu/annotation';

import type { IFileItem } from './types/data';
import type { BasicResult, ImageAttribute, SelectedResult, ToolResult, ToolStyle } from './interface/base';

export interface ViewContextProps {
  imageAttribute: {
    brightness: number;
    contrast: number;
    isOriginalSize: boolean;
    saturation: number;
    zoomRatio: number;
  };
  // 工具配置
  config?: LabelUAnnotationConfig;
  annotationEngine: AnnotationEngine | null;
  sample: IFileItem;
  currentToolName: EToolName;
  updateEngine: (container: HTMLDivElement) => void;
  leftSiderContent?: React.ReactNode | React.ReactNode; // 左侧图片列表操作空间
  topActionContent?: React.ReactNode | React.ReactNode; // 顶部操作空间

  isPreview: boolean;
  result: BasicResult;
  currentToolResult: ToolResult;
  textConfig: TextConfig;
  tagConfigList: InnerAttribute[];
  setResult: (result: BasicResult) => void;
  setToolName: Dispatch<SetStateAction<EToolName>>;
  allToolResult: BasicConfig[];
  allAttributesMap: Map<string, Map<Attribute['value'], Attribute>>;
  isShowOrder: boolean;
  setIsShowOrder: React.Dispatch<React.SetStateAction<boolean>>;
  setImageAttribute: React.Dispatch<React.SetStateAction<ImageAttribute>>;
  toolStyle: ToolStyle;
  setToolStyle: React.Dispatch<React.SetStateAction<ToolStyle>>;
  selectedResult: SelectedResult | null;
  setSelectedResult: (selectedResult: SelectedResult | null) => void;
  syncResultToEngine: () => void;
  engineResultUpdateTimeStamp: number;
  graphicResult: ToolResult[];
  isSidebarCollapsed: boolean;
  redo: () => void;
  undo: () => void;
}

const ViewContext = React.createContext({} as ViewContextProps);

export default ViewContext;
