import { LeftOutlined } from '@ant-design/icons';
import type { AnnotationEngine } from '@label-u/annotation';
import { i18n } from '@label-u/utils';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import { last } from 'lodash-es';
import React, { useReducer, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';

import { store } from '@/index';
import type { IStepInfo } from '@/types/step';
import type { Header } from '@/types/main';
import type { IFileItem } from '@/types/data';
import { loadImgList, PageForward, ToNextStep, ToSubmitFileData } from '@/store/annotation/actionCreators';
import type { AppState } from '@/store';
import type { EToolName } from '@/data/enums/ToolType';
import { ESubmitType, prefix } from '@/constant';
import type { BasicConfig } from '@/types/tool';

import HeaderOption from './headerOption';
import StepSwitch from './StepSwitch';
import ActionOption from './ActionOption';
// import { BasicConfig } from '@/types/tool';
import ToolOperation from './ToolOperation';
interface INextStep {
  stepProgress: number;
  stepList: IStepInfo[];
  step: number; // 当前步骤
  imgList: IFileItem[];
}

const NextButton: React.FC<{ disabled: boolean; imgList: IFileItem[] }> = ({ disabled, imgList }) => {
  const { t } = useTranslation();

  const toNext = () => {
    const { dispatch, getState } = store;
    // 点击下一步跳转到第一页 第一页没有图片的话则需要先加载图片
    if (imgList[0]) {
      dispatch(ToNextStep(0) as any);
    } else {
      loadImgList(dispatch, getState, 0).then((isSuccess) => {
        if (isSuccess) {
          dispatch(ToNextStep(0) as any);
        }
      });
    }
  };

  return (
    <Button
      type="primary"
      style={{
        marginLeft: 10,
      }}
      onClick={toNext}
      disabled={disabled}
    >
      {t('NextStep')}
    </Button>
  );
};

const NextStep: React.FC<INextStep> = ({ step, stepProgress, stepList, imgList }) => {
  const { t } = useTranslation();
  // 最后一步不显示下一步按钮
  const lastStep = last(stepList)?.step;

  if (stepList.length < 2 || step === lastStep) {
    return null;
  }

  const disabled = stepProgress < 1;

  if (disabled) {
    return (
      <Tooltip title={t('StepNotFinishedNotify')}>
        <span>
          <NextButton disabled={disabled} imgList={imgList} />
        </span>
      </Tooltip>
    );
  }

  return <NextButton disabled={disabled} imgList={imgList} />;
};

interface IToolHeaderProps {
  isPreview?: boolean;
  goBack?: (imgList?: IFileItem[]) => void;
  exportData?: (data: any[]) => void;
  header?: Header;
  headerName?: string;
  imgList: IFileItem[];
  annotationEngine: AnnotationEngine;
  stepProgress: number;
  toolName: EToolName;
  stepInfo: IStepInfo;
  stepList: IStepInfo[];
  step: number;
  toolsBasicConfig: BasicConfig[];
  topActionContent?: React.ReactNode;
}

const ToolHeader: React.FC<IToolHeaderProps> = ({
  goBack,
  isPreview,
  // exportData,
  header,
  headerName,
  imgList,
  stepProgress,
  stepInfo,
  stepList,
  step,
  annotationEngine,
  toolsBasicConfig,
  topActionContent,
}) => {
  const dispatch = useDispatch();
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const ref = useRef(null);

  // const size = useSize(ref);
  // const width = size?.width ?? window?.innerWidth;
  // render 数据展示
  // const currentOption = <ExportData exportData={exportData} />;

  const closeAnnotation = () => {
    dispatch(ToSubmitFileData(ESubmitType.Quit));

    if (goBack) {
      goBack(imgList);
    }
  };

  const changeLanguage = (lang: 'en' | 'cn') => {
    i18n.changeLanguage(lang);
    annotationEngine?.setLang(lang);
    forceUpdate();
  };

  const curLang = i18n.language;

  const backNode = <LeftOutlined className={`${prefix}-header__icon`} onClick={closeAnnotation} />;

  const headerNameNode = headerName ? <span className={`${prefix}-header__name`}>{headerName}</span> : '';

  const stepListNode = stepList.length > 1 && (
    <>
      <StepSwitch stepProgress={stepProgress} />
      <NextStep step={step} stepProgress={stepProgress} stepList={stepList} imgList={imgList} />
    </>
  );

  const headerOptionNode = <HeaderOption stepInfo={stepInfo} />;

  const langNode = (
    <div className={`${prefix}-header__lang`}>
      <span className={`${prefix}-langCN ${curLang === 'cn' ? 'active' : ''}`} onClick={() => changeLanguage('cn')}>
        中文
      </span>
      {` / `}
      <span className={`${prefix}-langEN ${curLang === 'en' ? 'active' : ''}`} onClick={() => changeLanguage('en')}>
        En
      </span>
    </div>
  );

  const NextImageOption = (
    <div className="nextImageOption">
      {topActionContent ? (
        topActionContent
      ) : (
        <>
          <Button>跳过</Button>
          <Button
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              dispatch(PageForward());
            }}
          >
            下一页
          </Button>
        </>
      )}
    </div>
  );

  if (header) {
    if (typeof header === 'function') {
      return (
        <div className={classNames(`${prefix}-header`)} ref={ref}>
          <div className={`${prefix}-header__title`}>
            {header({
              backNode,
              headerNameNode,
              stepListNode,
              headerOptionNode,
              langNode,
            })}
          </div>
        </div>
      );
    } else {
      return header;
    }
  }

  return (
    <div className={classNames(`${prefix}-header`)} ref={ref}>
      <div className={`${prefix}-header__title`}>
        {/* {backNode}
        {headerNameNode}
        {stepListNode}
        {currentOption} */}
        <ToolOperation toolsBasicConfig={toolsBasicConfig} />
        <div id="operationNode" className={`${prefix}-header__operationNode`}>
          {headerOptionNode}
        </div>
        {/* <div className={`${prefix}-header__titlePlacement`} /> */}
        {/* {langNode} */}
        <ActionOption />
        {!isPreview && NextImageOption}
      </div>
    </div>
  );
};

const mapStateToProps = (state: AppState) => ({
  imgList: state.annotation.imgList,
  annotationEngine: state.annotation.annotationEngine,
  stepProgress: state.annotation.stepProgress,
  toolName: state.annotation.stepList[state.annotation.step - 1]?.tool,
  stepList: state.annotation.stepList,
  stepInfo: state.annotation.stepList[state.annotation.step - 1],
  step: state.annotation.step,
  toolsBasicConfig: state.annotation.toolsBasicConfig,
});

export default connect(mapStateToProps)(ToolHeader);
