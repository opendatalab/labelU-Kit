import type { Attribute, EToolName } from '@label-u/annotation';
import { AnnotationEngine, CommonToolUtils, ImgUtils, cTool, BasicToolOperation } from '@label-u/annotation';
import { i18n } from '@label-u/utils';
import { message } from 'antd/es';
import _ from 'lodash-es';

import { getFormatSize } from '@/components/customResizeHook';
import { ANNOTATION_ACTIONS } from '@/store/Actions';
import { jsonParser } from '@/utils';
import AnnotationDataUtils from '@/utils/AnnotationDataUtils';
// import { ConfigUtils } from '@/utils/ConfigUtils';
import { composeResult, composeResultWithBasicImgInfo } from '@/utils/data';
import StepUtils from '@/utils/StepUtils';

import type { ToolStyleState } from '../toolStyle/types';
import { SetAnnotationLoading } from './actionCreators';
import type { AnnotationActionTypes, AnnotationState } from './types';
const { EVideoToolName } = cTool;

export const getStepConfig = (stepList: any[], step: number) => stepList.find((i) => i.step === step);

const initialState: AnnotationState = {
  isShowOrder: false,
  currentToolName: '',
  annotationEngine: null,
  toolInstance: null,
  imgList: [],
  tagConfigList: [],
  attributeList: [],
  toolsBasicConfig: [],
  textConfig: [],
  config: '{}',
  imgIndex: 0,
  basicIndex: 0,
  imgPageSize: 1,
  step: 1,
  stepList: [],
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  imgNode: {} as HTMLImageElement,
  basicResultList: [],
  resultList: [],
  stepProgress: 0,
  loading: false,
  triggerEventAfterIndexChanged: false,
};
if (typeof Image !== 'undefined') {
  initialState.imgNode = new Image();
}
/**
 * 获取当前文件列表的总页数
 * @param state
 */
export const getTotalPage = (state: AnnotationState) => {
  const { imgList, imgPageSize } = state;
  return Math.ceil(imgList.length / imgPageSize);
};

const calcStepProgress = (fileList: any[], step: number) =>
  fileList.reduce((pre, i) => {
    if (i) {
      const resultStr = i.result;
      const resultObject = jsonParser(resultStr);
      if (resultObject[`step_${step}`]) {
        return pre + 1;
      }
    }
    return pre;
  }, 0) / fileList.length;

const updateToolInstance = (annotation: AnnotationState, imgNode: HTMLImageElement, toolStyle: ToolStyleState) => {
  const { step, stepList, attributeList, tagConfigList, toolInstance, toolsBasicConfig, isShowOrder } = annotation;
  const stepConfig = StepUtils.getCurrentStepInfo(step, stepList);
  // const stepConfig = stepList[0]; // 修改为无步骤，因此无需通过步骤来选定工具
  // 此前工具绑定时间清空
  if (toolInstance) {
    toolInstance.eventUnbinding?.();
    // toolInstance.destroy();
    // toolInstance.setPrevResultList([]);
  } // 在工具中统一用json对象，在web层统一处理string 和 json转换
  // const config = ConfigUtils.jsonParser(stepConfig.config);
  const config = stepConfig.config;
  // 视频工具不支持实例化
  if ((Object.values(EVideoToolName) as string[]).includes(stepConfig.tool)) {
    return;
  }

  const container = document.getElementById('toolContainer');
  if (!container) {
    throw Error(`Not exist dom named id-toolContainer`);
  }
  const canvasSize = getFormatSize({ width: window?.innerWidth, height: window?.innerHeight });

  let allAttributesList: Attribute[] = [];
  /**
   * TODO: 为了兼容历史配置数据，此处过滤掉空的属性；但是后续应该在保存配置的时候就过滤掉，或者校验空值。
   * 修正：https://project.feishu.cn/bigdata_03/issue/detail/3877218?parentUrl=%2Fbigdata_03%2FissueView%2FXARIG5p4g
   **/
  const noneEmptyAttributeList = attributeList.filter((i) => i.key !== '' && i.value !== '');
  if (noneEmptyAttributeList && noneEmptyAttributeList.length > 0) {
    allAttributesList = [...allAttributesList, ...noneEmptyAttributeList];
  }
  if (toolsBasicConfig && toolsBasicConfig.length > 0) {
    for (let i = 0; i < toolsBasicConfig.length; i++) {
      // @ts-ignore
      if (toolsBasicConfig[i].config?.attributeList) {
        allAttributesList = [
          ...allAttributesList,
          // @ts-ignore
          ...toolsBasicConfig[i].config?.attributeList.filter(
            (item: Attribute) => item.key !== '' && item.value !== '',
          ),
        ];
      }
    }
  }

  const annotationEngine = new AnnotationEngine({
    container,
    isShowOrder: isShowOrder,
    toolName: stepConfig.tool as EToolName,
    size: canvasSize,
    imgNode,
    config,
    style: toolStyle,
    tagConfigList,
    attributeList: noneEmptyAttributeList,
    allAttributesList,
  });

  // 切换工具时，高亮上一个工具且本工具也存在的标签
  const lastActiveAttribute = BasicToolOperation.Cache.get('activeAttribute');
  if (annotationEngine?.toolInstance.config.attributeMap.has(lastActiveAttribute)) {
    annotationEngine.toolInstance.setDefaultAttribute?.(lastActiveAttribute);
  } else if (typeof annotationEngine.toolInstance.setDefaultAttribute === 'function') {
    annotationEngine.toolInstance.setDefaultAttribute(annotationEngine.toolInstance.NoneAttribute);
  }

  return { toolInstance: annotationEngine?.toolInstance, annotationEngine };
};

/**
 * 支持并优先外部传入的获取文件接口
 * @param nextIndex
 */
const TryGetFileDataByAPI = (nextIndex: number) => async (dispatch: any, getState: any) => {
  const { getFileData, imgList } = getState().annotation;
  if (getFileData) {
    const fileData = await getFileData(imgList[nextIndex], nextIndex);
    dispatch({
      type: ANNOTATION_ACTIONS.SET_FILE_DATA,
      payload: {
        fileData,
        index: nextIndex,
      },
    });
  }
};

const AfterVideoLoaded = (nextIndex: number) => (dispatch: any) => {
  SetAnnotationLoading(dispatch, false);

  dispatch({
    type: ANNOTATION_ACTIONS.LOAD_FILE_DATA,
    payload: {
      nextIndex,
    },
  });
};

const AfterImageLoaded = (nextIndex: number, nextBasicIndex?: number) => (dispatch: any, getState: any) => {
  const { toolInstance, imgList } = getState().annotation;
  const url = imgList?.[nextIndex]?.url;
  ImgUtils.load(url)
    .then((imgNode: HTMLImageElement) => {
      SetAnnotationLoading(dispatch, false);
      dispatch({
        type: ANNOTATION_ACTIONS.LOAD_FILE_DATA,
        payload: {
          imgNode,
          nextIndex,
          nextBasicIndex,
        },
      });
    })
    .catch(() => {
      SetAnnotationLoading(dispatch, false);
      toolInstance?.setErrorImg();
      dispatch({
        type: ANNOTATION_ACTIONS.LOAD_FILE_DATA,
        payload: {
          nextIndex,
          nextBasicIndex,
        },
      });
    });
};

/**
 * 初始化imgNode并加载数据
 * @param nextIndex
 * @param nextBasicIndex
 */
export const LoadFileAndFileData =
  (nextIndex: number, nextBasicIndex?: number): any =>
  async (dispatch: any, getState: any) => {
    const { stepList, step } = getState().annotation;
    const currentIsVideo = StepUtils.currentToolIsVideo(step, stepList);

    SetAnnotationLoading(dispatch, true);

    dispatch(TryGetFileDataByAPI(nextIndex));

    if (currentIsVideo) {
      dispatch(AfterVideoLoaded(nextIndex));
      return;
    }

    dispatch(AfterImageLoaded(nextIndex, nextBasicIndex));
  };

export const annotationReducer = (state = initialState, action: AnnotationActionTypes): AnnotationState => {
  switch (action.type) {
    case ANNOTATION_ACTIONS.UPDATE_TOOL_INSTANCE: {
      return {
        ...state,
        toolInstance: action.payload.toolInstance,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_TEXT_CONFIG: {
      return {
        ...state,
        textConfig: action.payload.textConfig,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_ATTRIBUTE_LIST: {
      return {
        ...state,
        attributeList: action.payload.attributeList,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_TOOLS_CONFIG: {
      return {
        ...state,
        toolsBasicConfig: action.payload.toolsBasicConfig,
      };
    }
    case ANNOTATION_ACTIONS.UPDATE_CURRENT_TOOLNAME: {
      return {
        ...state,
        currentToolName: action.payload.toolName,
      };
    }
    case ANNOTATION_ACTIONS.UPDATE_IS_SHOW_ORDER: {
      return {
        ...state,
        isShowOrder: action.payload.isShowOrder,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_TAG_LIST: {
      return {
        ...state,
        tagConfigList: action.payload.tagConfigList,
      };
    }
    case ANNOTATION_ACTIONS.UPDATE_IMG_LIST: {
      return {
        ...state,
        imgList: action.payload.imgList,
      };
    }

    case ANNOTATION_ACTIONS.CALC_STEP_PROGRESS: {
      const { imgList, step } = state;

      const stepProgress = calcStepProgress(imgList, step);

      return {
        ...state,
        stepProgress,
      };
    }

    case ANNOTATION_ACTIONS.SUBMIT_FILE_DATA: {
      const { imgList, imgIndex, step, stepList, toolInstance, onSubmit, resultList } = state;
      if (!toolInstance || !imgList[imgIndex]) {
        return state;
      }
      const oldResultString = imgList[imgIndex]?.result || '';
      const [, basicImgInfo] = toolInstance?.exportData() ?? [];
      const resultWithBasicInfo = composeResultWithBasicImgInfo(oldResultString, basicImgInfo);
      const newResultString = composeResult(resultWithBasicInfo, { step, stepList }, { rect: resultList });
      imgList[imgIndex].result = AnnotationDataUtils.dataCorrection(newResultString, oldResultString, step, stepList);

      if (onSubmit) {
        onSubmit([imgList[imgIndex]], action.payload?.submitType, imgIndex);
      }

      const stepProgress = calcStepProgress(imgList, step);
      return {
        ...state,
        stepProgress,
        imgList,
      };
    }

    case ANNOTATION_ACTIONS.SAVE_RESULT: {
      const { imgList, imgIndex, onSave } = state;
      onSave?.(imgList[imgIndex], imgIndex, imgList);
      return {
        ...state,
      };
    }

    case ANNOTATION_ACTIONS.SUBMIT_RESULT: {
      const { imgList, basicIndex, resultList, toolInstance, basicResultList } = state;

      if (!toolInstance) {
        return state;
      }
      const [exportResult] = toolInstance?.exportData() ?? [];

      let previousResultList = exportResult;

      if (basicResultList?.length > 0) {
        const sourceID = basicResultList[basicIndex]?.id;
        const newResultData = exportResult.map((i: any) => ({ ...i, sourceID }));
        previousResultList = _.cloneDeep(resultList).filter((i: any) => {
          // 修正 https://project.feishu.cn/bigdata_03/issue/detail/3528264?parentUrl=%2Fbigdata_03%2FissueView%2FXARIG5p4g
          if ((i.sourceID === '' || i.sourceID === undefined) && (sourceID === '' || sourceID === undefined)) {
            return false;
          }

          return i.sourceID !== sourceID;
        });
        previousResultList.push(...newResultData);
      }
      return {
        ...state,
        resultList: previousResultList,
        imgList,
      };
    }

    case ANNOTATION_ACTIONS.SET_BASIC_INDEX: {
      const { toolInstance, step, imgList, imgIndex, stepList, annotationEngine, resultList, basicResultList } = state;

      if (!toolInstance || !annotationEngine) {
        return state;
      }

      const nextBasicIndex = action.payload.basicIndex;
      const sourceID = basicResultList[nextBasicIndex]?.id;

      const fileResult = jsonParser(imgList[imgIndex]?.result);
      const result = (resultList || []).filter((i) => i.sourceID === sourceID);

      const stepConfig = getStepConfig(stepList, step);

      const { dataSourceStep, tool } = stepConfig;
      const dependStepConfig = getStepConfig(stepList, dataSourceStep);
      let stepBasicResultList = [];

      if (dataSourceStep && tool) {
        stepBasicResultList = fileResult[`step_${dataSourceStep}`]?.result;
        if (stepBasicResultList?.length > 0) {
          annotationEngine?.setBasicInfo(dependStepConfig.tool, stepBasicResultList[nextBasicIndex]);
          annotationEngine?.launchOperation();
        } else {
          annotationEngine?.setBasicInfo(dependStepConfig.tool);
          annotationEngine?.forbidOperation();
          message.info(i18n.t('NoDependency'));
        }
      }
      toolInstance?.setResult(result);
      toolInstance?.history.initRecord(result, true);

      return {
        ...state,
        basicIndex: nextBasicIndex,
      };
    }

    case ANNOTATION_ACTIONS.SET_TRIGGER_EVENT_AFTER_INDEX_CHANGED: {
      const { triggerEventAfterIndexChanged } = action.payload;
      return {
        ...state,
        triggerEventAfterIndexChanged: !!triggerEventAfterIndexChanged,
      };
    }

    case ANNOTATION_ACTIONS.LOAD_FILE_DATA: {
      const { imgList, step, toolInstance, annotationEngine, stepList } = state;

      /**
       * TODO
       * Before: !toolInstance || !annotationEngine
       *
       * The roles of toolInstance and annotationEngine need to be clearly distinguished
       */
      if (!toolInstance) {
        return state;
      }
      const currentStepInfo = StepUtils.getCurrentStepInfo(step, stepList);

      const { nextIndex, imgNode, nextBasicIndex, imgError } = action.payload;
      const basicIndex = nextBasicIndex ?? 0;

      const fileResult = jsonParser(imgList[nextIndex]?.result);

      const stepResult = fileResult[stepList[0].tool];

      // const isInitData = !stepResult; // 是否为初始化数据

      const basicImgInfo = {
        rotate: fileResult.rotate ?? 0,
        valid: fileResult.valid ?? true,
      };
      if (imgNode && imgError !== true) {
        annotationEngine?.setImgNode(imgNode, basicImgInfo);
      }
      const stepConfig = getStepConfig(stepList, step);

      const { dataSourceStep, tool } = stepConfig;
      const dependStepConfig = getStepConfig(stepList, dataSourceStep);
      const hasDataSourceStep = dataSourceStep && tool;
      const stepBasicResultList = Object.keys(fileResult).reduce((res, key) => {
        if (key.indexOf('Tool') > 0 && key !== tool) {
          // @ts-ignore
          res.push(fileResult[key]);
        }
        return res;
      }, []);
      const result = AnnotationDataUtils.getInitialResultList(
        stepResult?.result,
        toolInstance,
        stepConfig,
        // stepBasicResultList,
        // isInitData,
      );
      // annotationEngine?.launchOperation();
      // 将此前绘制信息导入 wh
      if (stepBasicResultList && stepBasicResultList.length > 0) {
        annotationEngine?.setPrevResultList(stepBasicResultList);
      } else {
        // 将此前信息清空
        annotationEngine?.setPrevResultList([]);
      }
      // 删除依赖，后续考虑删除 todo wh
      if (hasDataSourceStep) {
        if (stepBasicResultList?.length > 0) {
          annotationEngine?.setBasicInfo(dependStepConfig.tool, stepBasicResultList[basicIndex]);
        } else {
          // TODO: 禁用绘制交互，有无依赖之间的操作切换
          annotationEngine?.setBasicInfo(dependStepConfig.tool);
          annotationEngine?.forbidOperation();
          message.info(i18n.t('NoDependency'));
        }
      }

      // TODO，非查看模式才允许添加数据
      if (currentStepInfo.tool !== 'check') {
        // @ts-ignore
        const sourceID = stepBasicResultList[basicIndex]?.id ?? '';
        const resultForBasicIndex = hasDataSourceStep
          ? result.filter((i: { sourceID: string | number }) => CommonToolUtils.isSameSourceID(i.sourceID, sourceID))
          : result;
        toolInstance?.setResult(resultForBasicIndex);
        toolInstance?.history.initRecord(result, true);
      }
      return {
        ...state,
        imgIndex: nextIndex,
        basicIndex,
        basicResultList: stepBasicResultList,
        resultList: result,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_ANNOTATION_CONFIG: {
      return {
        ...state,
        config: action.payload.config ?? '{}',
      };
    }

    case ANNOTATION_ACTIONS.SET_TASK_CONFIG: {
      const { stepList, step } = action.payload;
      return {
        ...state,
        stepList,
        step,
      };
    }

    case ANNOTATION_ACTIONS.INIT_TOOL: {
      const { toolStyle } = action.payload;
      const { imgNode } = state;
      const instance = updateToolInstance(state, imgNode, toolStyle);
      if (instance) {
        const { toolInstance, annotationEngine } = instance;
        return {
          ...state,
          toolInstance,
          annotationEngine,
        };
      }

      return {
        ...state,
      };
    }

    // react hook tool Proprietary operations
    case ANNOTATION_ACTIONS.SET_TOOL: {
      const instance = action.payload?.instance;
      if (instance) {
        return {
          ...state,
          toolInstance: instance,
          // TODO It needs to optimize
          // annotationEngine: {
          //   toolInstance: instance,
          // } as any,
        };
      }

      return {
        ...state,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_ON_SUBMIT: {
      return {
        ...state,
        onSubmit: action.payload.onSubmit,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_ON_SAVE: {
      return {
        ...state,
        onSave: action.payload.onSave,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_ON_PAGE_CHANGE: {
      return {
        ...state,
        onPageChange: action.payload.onPageChange,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_ON_STEP_CHANGE: {
      return {
        ...state,
        onStepChange: action.payload.onStepChange,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_GET_FILE_DATA: {
      return {
        ...state,
        getFileData: action.payload.getFileData,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_PAGE_SIZE: {
      return {
        ...state,
        pageSize: action.payload.pageSize,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_LOAD_FILE_LIST: {
      return {
        ...state,
        loadFileList: action.payload.loadFileList,
      };
    }

    case ANNOTATION_ACTIONS.SET_FILE_DATA: {
      const { fileData, index } = action.payload;
      const { imgList } = state;
      imgList[index] = { ...imgList[index], ...fileData };

      return {
        ...state,
        imgList,
      };
    }

    case ANNOTATION_ACTIONS.UPDATE_ROTATE: {
      const { toolInstance } = state;
      toolInstance?.updateRotate();

      return state;
    }

    case ANNOTATION_ACTIONS.COPY_BACKWARD_RESULT: {
      const { toolInstance, imgIndex, imgList, step, currentToolName } = state;
      if (!toolInstance) {
        return state;
      }

      if (imgIndex === 0 || imgIndex >= imgList.length) {
        console.error('无法复制边界外的内容');
        return state;
      }
      const backwardResult = imgList[imgIndex - 1].result;
      if (!backwardResult) {
        return state;
      }

      const newResult = AnnotationDataUtils.copyResultChange(backwardResult, step, imgList[imgIndex].result ?? '');
      imgList[imgIndex].result = newResult;

      // 更新当前的结果
      const fileResult = jsonParser(newResult);
      const basicResultList = Object.keys(fileResult).reduce((res, key) => {
        if (key.indexOf('Tool') > 0 && key !== currentToolName) {
          // @ts-ignore
          res.push(fileResult[key]);
        }
        return res;
      }, []);

      const stepResult = fileResult[currentToolName];
      const result = stepResult?.result || [];
      toolInstance?.setResult(result);
      toolInstance?.setPrevResultList(basicResultList);
      toolInstance?.history.pushHistory(result);

      return {
        ...state,
        imgList: [...imgList],
      };
    }

    case ANNOTATION_ACTIONS.SET_STEP: {
      const { stepList, annotationEngine } = state;
      const { toStep } = action.payload;

      if (!annotationEngine) {
        return state;
      }

      const stepConfig = getStepConfig(stepList, toStep);
      annotationEngine?.setToolName(stepConfig.tool, stepConfig.config);

      return {
        ...state,
        step: toStep,
        toolInstance: annotationEngine?.toolInstance,
      };
    }

    case ANNOTATION_ACTIONS.SET_LOADING: {
      const { loading } = action.payload;

      return {
        ...state,
        loading: !!loading,
      };
    }

    // eslint-disable-next-line no-fallthrough
    default:
      return state;
  }
};
