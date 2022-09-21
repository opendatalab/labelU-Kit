declare interface IAnnotationTaskInfo {
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

type Result = IPolygonData | Rect;

declare interface PrevResult {
  toolName: string;
  result: Result[];
}

declare interface Attribute {
  key: string;
  value: string;
}

declare interface OneTag {
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
