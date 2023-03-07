import { i18n } from '@label-u/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { BasicToolOperation } from '@label-u/annotation';
import _ from 'lodash-es';

import MainView from '@/views/MainView';
import type { BasicConfig, Attribute, OneTag, TextConfig } from '@/interface/toolConfig';

import { store } from '.';
import type { AppState } from './store';
import { ANNOTATION_ACTIONS } from './store/Actions';
import { ChangeCurrentTool, InitTaskData, loadImgList } from './store/annotation/actionCreators';
import { LoadFileAndFileData } from './store/annotation/reducer';
import type { ToolInstance } from './store/annotation/types';
import type { GetFileData, OnSave, OnSubmit, IFileItem, OnPageChange, OnStepChange, LoadFileList } from './types/data';
import type { Footer, Header, Sider } from './types/main';
import type { IStepInfo } from './types/step';

interface IAnnotationStyle {
  strokeColor: string;
  fillColor: string;
  textColor: string;
  toolColor: any;
}

export interface AppProps {
  toolStyle?: IAnnotationStyle;
  exportData?: (data: any[]) => void;
  goBack?: (data: any) => void;
  imgList?: IFileItem[];
  config?: string;
  stepList?: IStepInfo[];
  step?: number;
  isPreview?: boolean; // if preview
  onSubmit?: OnSubmit;
  onSave?: OnSave;
  onPageChange?: OnPageChange;
  onStepChange?: OnStepChange;
  getFileData?: GetFileData;
  pageSize?: number;
  loadFileList?: LoadFileList;
  headerName?: string;
  initialIndex?: number;
  className?: string;
  toolInstance?: ToolInstance;
  currentToolName?: string; // redux
  header?: Header;
  footer?: Footer;
  sider?: Sider;
  style?: {
    layout?: Record<string, any>;
    header?: Record<string, any>;
    sider?: Record<string, any>;
    footer?: Record<string, any>;
  };
  setToolInstance?: (tool: ToolInstance) => void;
  mode?: 'light' | 'dark'; // 临时需求应用于 toolFooter 的操作
  showTips?: boolean; // 是否展示 tips
  defaultLang?: 'en' | 'cn'; // 国际化设置
  leftSiderContent?: React.ReactNode | React.ReactNode; // 左侧图片列表操作空间
  topActionContent?: React.ReactNode | React.ReactNode; // 顶部操作空间
  tagConfigList?: OneTag[]; // 配置tag 信息，工具共享一套tag
  attributeList?: Attribute[]; // 标签配置选项，工具共享一套标签
  toolsBasicConfig: BasicConfig[]; // 多工具配置
  textConfig: TextConfig;
  // 标注信息扩展的功能
  dataInjectionAtCreation?: (annotationData: any) => {};
  // 是否显示标注顺序
  isShowOrder?: boolean;
  // 渲染增强
  renderEnhance?: {
    staticRender?: (canvas: HTMLCanvasElement, data: any, style: IAnnotationStyle) => void;
    selectedRender?: (canvas: HTMLCanvasElement, data: any, style: IAnnotationStyle) => void;
    creatingRender?: (canvas: HTMLCanvasElement, data: any, style: IAnnotationStyle) => void;
  };
}

const App: React.FC<AppProps> = (props) => {
  const {
    imgList,
    step = 1,
    stepList,
    onSubmit,
    onSave,
    toolStyle,
    currentToolName,
    onPageChange,
    onStepChange,
    // @ts-ignore
    initialIndex = BasicToolOperation.Cache.get('nextIndex') || 0,
    toolInstance,
    tagConfigList,
    attributeList,
    toolsBasicConfig,
    textConfig,
    setToolInstance,
    getFileData,
    pageSize = 10,
    loadFileList,
    defaultLang = 'cn',
  } = props;
  //@ts-ignore
  if (props.imgList && props.imgList.length > 0) {
    console.info('result', props.imgList[0].result);
  }

  // 初始化imgList 优先以loadFileList方式加载数据
  const initImgList = useCallback(() => {
    if (loadFileList) {
      loadImgList(store.dispatch, store.getState, initialIndex as number, true).then((isSuccess) => {
        if (isSuccess) {
          store.dispatch(LoadFileAndFileData(initialIndex as number));
        }
      });
    } else if (imgList && imgList.length > 0) {
      store.dispatch({
        type: ANNOTATION_ACTIONS.UPDATE_IMG_LIST,
        payload: {
          imgList,
        },
      });
      store.dispatch(LoadFileAndFileData(initialIndex as number));
    }
  }, [imgList, initialIndex, loadFileList]);

  const dispatch = useDispatch();

  const { isShowOrder } = useSelector((state: AppState) => state.annotation);
  const [imgUrl, setImgUrl] = useState<string>();

  useEffect(() => {
    if (imgList && imgList?.length > 0 && imgList[0].url) {
      setImgUrl(imgList[0].url);
    }
  }, [imgList]);

  // unmount时销毁BasicToolOperation.Cache
  useEffect(
    () => () => {
      // @ts-ignore
      BasicToolOperation.Cache.clear();
    },
    [],
  );

  const shouldInitial = useMemo(() => {
    return _.size(imgList) > 0 && _.size(props.toolsBasicConfig) > 0;
  }, [imgList, props.toolsBasicConfig]);

  useEffect(() => {
    if (!shouldInitial) {
      return;
    }

    let initToolName = currentToolName;
    const findToolConfigByToolName = toolsBasicConfig.filter((item) => {
      return item.tool === currentToolName;
    });
    // 当工具配置中不包含currentToolName时，重置currentToolName
    if (findToolConfigByToolName && findToolConfigByToolName.length === 0) {
      initToolName = toolsBasicConfig[0].tool;
      dispatch(ChangeCurrentTool(initToolName));
    }

    store.dispatch(
      InitTaskData({
        toolStyle,
        // NOTE: 切换工具必须重新初始化AnnotationEngine
        initToolName,
        onSubmit,
        stepList: stepList || [],
        tagConfigList,
        attributeList,
        toolsBasicConfig,
        textConfig,
        step,
        getFileData,
        pageSize,
        loadFileList,
        onSave,
        onPageChange,
        onStepChange,
      }),
    );
    initImgList();
    // 初始化国际化语言
    i18n.changeLanguage(defaultLang);
  }, [
    defaultLang,
    dispatch,
    getFileData,
    initImgList,
    loadFileList,
    currentToolName,
    onPageChange,
    onSave,
    onStepChange,
    onSubmit,
    pageSize,
    step,
    stepList,
    shouldInitial,
    // ====
    attributeList,
    tagConfigList,
    textConfig,
    toolStyle,
    toolsBasicConfig,
    // REVIEW: 尚不清楚imgUrl为何要加在deps中
    imgUrl,
  ]);

  useEffect(() => {
    if (toolInstance) {
      setToolInstance?.(toolInstance);
      toolInstance.setIsShowOrder(isShowOrder);
    }
  }, [toolInstance, isShowOrder, setToolInstance]);

  return (
    <div id="annotationCotentAreaIdtoGetBox">
      <MainView {...props} currentToolName={currentToolName as string} />
    </div>
  );
};

const mapStateToProps = (state: AppState) => ({
  toolInstance: state.annotation.toolInstance,
  currentToolName: state.annotation.currentToolName,
  toolStyle: state.toolStyle,
});

export default connect(mapStateToProps)(App);
