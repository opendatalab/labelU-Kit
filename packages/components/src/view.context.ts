import type { Dispatch, SetStateAction } from 'react';
import React from 'react';
import type { AnnotationEngine, Attribute, EToolName } from '@label-u/annotation';

import type { LabelUAnnotationConfig, TextConfig } from './interface/toolConfig';
import type { IFileItem } from './types/data';

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
  result: any;
  currentToolResult: any;
  textConfig: TextConfig;
  tagConfigList: any[];
  setResult: (result: any) => void;
  setToolName: Dispatch<SetStateAction<EToolName>>;
  allToolResult: any[];
  allAttributesMap: Map<string, Map<Attribute['value'], Attribute>>;
  isShowOrder: boolean;
  setIsShowOrder: (isShowOrder: boolean) => void;
  setImageAttribute: (imageAttribute: any) => void;
  toolStyle: any;
  setToolStyle: (toolStyle: any) => void;
  selectedResult: any;
  setSelectedResult: (selectedResult: any) => void;
  syncResultToEngine: () => void;
  engineResultUpdateTimeStamp: number;
  graphicResult: any;
}

const ViewContext = React.createContext({} as ViewContextProps);

export default ViewContext;
