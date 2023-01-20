import type { IPoint } from './common';

export interface ILinePoint extends IPoint {
  id: string;
  specialEdge?: boolean;
}

export interface ILine {
  id: string;
  valid: boolean;
  pointList?: ILinePoint[];
  isVisible: boolean;
  order: number;
  label?: string;
  sourceID?: string;
  attribute?: string;
  textAttribute?: string;
  isReference?: boolean;
}
