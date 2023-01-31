import type {
  AnnotationEngine,
  RectOperation,
  TagOperation,
  TextToolOperation,
  PointOperation,
  PolygonOperation,
  LineToolOperation,
  Attribute,
  OneTag,
} from '@label-u/annotation';

import type { ANNOTATION_ACTIONS } from '@/store/Actions';
import type { IStepInfo } from '@/types/step';
import type { OnSubmit, IFileItem, GetFileData, OnSave, OnPageChange, OnStepChange, LoadFileList } from '@/types/data';
import type { ESubmitType } from '@/constant';
import type { BasicConfig } from '@/types/tool';
import type { TextConfig } from '@/interface/toolConfig';

export type GraphToolInstance = RectOperation | PointOperation | PolygonOperation | LineToolOperation;

export type ToolInstance = GraphToolInstance | TagOperation | TextToolOperation;

interface CommonActions {
  type: string;
  payload?: any;
}

export interface AnnotationState {
  isShowOrder: boolean;
  currentToolName: string; // 当前工具名称
  toolInstance: ToolInstance | null;
  annotationEngine: AnnotationEngine | null;
  imgList: IFileItem[];
  config: string;
  imgIndex: number;
  imgPageSize: number;
  tagConfigList: OneTag[]; // 配置tag 信息，工具共享一套tag
  attributeList: Attribute[]; // 标签配置选项，工具共享一套标签
  toolsBasicConfig?: BasicConfig[]; // 融合标注工具配置
  textConfig?: TextConfig;
  step: number;
  stepList: IStepInfo[];
  imgNode: HTMLImageElement;
  onSubmit?: OnSubmit;
  onSave?: OnSave;
  onPageChange?: OnPageChange;
  onStepChange?: OnStepChange;
  getFileData?: GetFileData;
  loadFileList?: LoadFileList;
  pageSize?: number;
  basicIndex: number;
  basicResultList: any[];
  resultList: any[];
  stepProgress: number;
  loading: boolean; // 用于图片加载
  /** 阻止文件切换后的事件 */
  triggerEventAfterIndexChanged: boolean;
}

interface UpdateToolInstance {
  type: typeof ANNOTATION_ACTIONS.UPDATE_TOOL_INSTANCE;
  payload: {
    toolInstance: ToolInstance;
    annotationEngine: AnnotationEngine;
  };
}

interface UpdateImgList {
  type: typeof ANNOTATION_ACTIONS.UPDATE_IMG_LIST;
  payload: {
    imgList: IFileItem[];
  };
}

interface UpdateAnnotationConfig {
  type: typeof ANNOTATION_ACTIONS.UPDATE_ANNOTATION_CONFIG;
  payload: {
    config: string;
  };
}

interface SubmitFileData extends CommonActions {
  type: typeof ANNOTATION_ACTIONS.SUBMIT_FILE_DATA;
  payload: {
    submitType: ESubmitType;
  };
}

interface LoadFileData extends CommonActions {
  type: typeof ANNOTATION_ACTIONS.LOAD_FILE_DATA;
  payload: {
    nextIndex: number;
  };
}

interface SetTaskConfig {
  type: typeof ANNOTATION_ACTIONS.SET_TASK_CONFIG;
  payload: {
    stepList: IStepInfo[];
    step: number;
  };
}
interface InitTool {
  type: typeof ANNOTATION_ACTIONS.INIT_TOOL;
  payload: {
    stepList: IStepInfo[];
    step: number;
  };
}

interface UpdateOnSubmit {
  type: typeof ANNOTATION_ACTIONS.UPDATE_ON_SUBMIT;
  payload: {
    onSubmit: OnSubmit;
  };
}

interface UpdateOnSave {
  type: typeof ANNOTATION_ACTIONS.UPDATE_ON_SAVE;
  payload: {
    onSave: OnSave;
  };
}

interface UpdateOnPageChange {
  type: typeof ANNOTATION_ACTIONS.UPDATE_ON_PAGE_CHANGE;
  payload: {
    getFileData: OnPageChange;
  };
}
interface UpdateOnStepChange {
  type: typeof ANNOTATION_ACTIONS.UPDATE_ON_STEP_CHANGE;
  payload: {
    getFileData: OnStepChange;
  };
}

interface UpdateGetFileData {
  type: typeof ANNOTATION_ACTIONS.UPDATE_GET_FILE_DATA;
  payload: {
    getFileData: GetFileData;
  };
}
interface UpdatePageSize {
  type: typeof ANNOTATION_ACTIONS.UPDATE_PAGE_SIZE;
  payload: {
    pageSize: number;
  };
}

interface UpdateGetFileList {
  type: typeof ANNOTATION_ACTIONS.UPDATE_LOAD_FILE_LIST;
  payload: {
    getFileData: LoadFileList;
  };
}

interface CopyBackWordResult extends CommonActions {
  type: typeof ANNOTATION_ACTIONS.COPY_BACKWARD_RESULT;
}

export type AnnotationActionTypes =
  | UpdateToolInstance
  | UpdateImgList
  | UpdateAnnotationConfig
  | SubmitFileData
  | LoadFileData
  | SetTaskConfig
  | InitTool
  | UpdateOnSubmit
  | UpdateOnPageChange
  | UpdateOnStepChange
  | UpdateGetFileData
  | UpdatePageSize
  | UpdateGetFileList
  | CopyBackWordResult
  | UpdateOnSave;
