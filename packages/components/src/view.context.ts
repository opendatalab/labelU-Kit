import React from 'react';

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
  config: any;
  annotationEngine: any;
  sample: IFileItem;
  currentToolName: string;
  updateEngine: (container: HTMLDivElement) => void;
  leftSiderContent?: React.ReactNode | React.ReactNode; // 左侧图片列表操作空间
  topActionContent?: React.ReactNode | React.ReactNode; // 顶部操作空间

  isPreview: boolean;
  result: any;
  currentToolResult: any;
  textConfig: any;
  tagConfigList: any[];
  setResult: (result: any) => void;
  setToolName: (toolName: string) => void;
  allToolResult: any[];
  allAttributesMap: Map<string, any>;
  isShowOrder: boolean;
  setIsShowOrder: (isShowOrder: boolean) => void;
  setImageAttribute: (imageAttribute: any) => void;
  toolStyle: any;
  setToolStyle: (toolStyle: any) => void;
  selectedResult: any;
  setSelectedResult: (selectedResult: any) => void;
  triggerVisibilityChange: () => void;
  resultVisibilityChanged: (result: any) => void;
  graphicResult: any;
}

const ViewContext = React.createContext({} as ViewContextProps);

export default ViewContext;
