import type { IPolygonData } from './tool/polygon';

export interface IAnnotationTaskInfo {
  id: string;
  name: string;
  type: number;
  desc: string;
  status: number;
  dataset: {
    id: string;
    name: string;
    fileCount: number;
    totalSize: number;
    tags: string[];
  };
  currentStep: number;
}

export type Result = IPolygonData;

export interface PrevResult {
  toolName: string;
  result: Result[];
}

export interface Attribute {
  key: string;
  value: string;
}

export interface OneTag {
  key: string;
  value: string;
  isMulti: boolean;
  subSelected: SubSelected[];
}

interface SubSelected {
  key: string;
  value: string;
  isDefault: boolean;
}
