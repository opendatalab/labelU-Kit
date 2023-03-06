import React, { useState } from 'react';
import { Popconfirm } from 'antd/es';
import { StopOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';

import copyBackStepSvg from '../../../../assets/annotation/common/icon_invalid.svg';
import copyBackStepASvg from '../../../../assets/annotation/common/icon_invalid_a.svg';
import { store } from '../../../../index';
import type { AppState } from '../../../../store';
import type { ToolInstance } from '../../../../store/annotation/types';
import StepUtils from '../../../../utils/StepUtils';
import type { IStepInfo } from '../../../../types/step';
// import { jsonParser } from '@/utils';
import type { AnnotationFileList } from '../../../../types/data';
import { CopyBackWordResult } from '../../../../store/annotation/actionCreators';

const makeSure = (info: string, key: string, t: any) => {
  return <div key={key}>{`${t('ConfirmTo')}${info.slice(0)}？`}</div>;
};

// const renderImg = (info: Element | string) => {
//   if (typeof info === 'string') {
//     return <img width={23} height={25} src={info} />;
//   }
//   return info;
// };

interface IProps {
  toolInstance: ToolInstance;
  stepInfo: IStepInfo;
  imgList: AnnotationFileList;
  imgIndex: number;
}

const GeneralOperation: React.FC<IProps> = ({ toolInstance, stepInfo }) => {
  const [isHover, setHover] = useState<string | null>(null);
  const { t } = useTranslation();
  const allOperation = [
    // {
    //   name: t('ClearLabel'),
    //   key: 'sureClear',
    //   imgSvg: clearResultSvg,
    //   hoverSvg: clearResultASvg,
    //   onClick: () => {
    //     toolInstance?.clearResult();
    //   },
    // },
  ];

  // const config = jsonParser(stepInfo?.config);
  const config = stepInfo?.config;
  if (stepInfo?.dataSourceStep === 0) {
    const iconStyle = {
      height: '25px',
      lineHeight: '25px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };
    allOperation.push({
      name: t(toolInstance.valid === true ? 'SetAsInvalid' : 'SetAsValid'),
      key: 'sureQuestion',
      imgSvg: <StopOutlined style={iconStyle} />,
      hoverSvg: <StopOutlined style={{ color: '#666fff', ...iconStyle }} />,
      onClick: () => {
        toolInstance.setValid(!toolInstance.valid);
      },
    });
  }

  if (config?.copyBackwardResult) {
    allOperation.unshift({
      name: t('CopyThePrevious'),
      key: 'sureCopy',
      imgSvg: copyBackStepSvg,
      hoverSvg: copyBackStepASvg,
      onClick: () => {
        store.dispatch(CopyBackWordResult());
      },
    });
  }

  // const annotationLength = Math.floor(24 / allOperation.length);

  return (
    <div className="newGeneralOperation">
      {allOperation.map((info) => (
        <div
          style={{ width: '100px' }}
          key={info.key}
          className="item"
          onMouseEnter={() => {
            setHover(info.key);
          }}
          onMouseLeave={() => {
            setHover(null);
          }}
        >
          <Popconfirm
            title={info.key.startsWith('sure') ? makeSure(info.name, info.key, t) : info.name}
            disabled={!info.key.startsWith('sure')}
            placement="topRight"
            okText={t('Confirm')}
            cancelText={t('Cancel')}
            onConfirm={info.onClick}
          >
            <div className="toolName" style={{ color: info.key === isHover ? '#1B67FF' : '' }}>
              {info.name}
            </div>
          </Popconfirm>
        </div>
      ))}
    </div>
  );
};

const mapStateToProps = (state: AppState) => {
  const stepInfo = StepUtils.getCurrentStepInfo(state.annotation?.step, state.annotation?.stepList);

  return {
    toolInstance: state.annotation.toolInstance,
    stepInfo,
    imgList: state.annotation.imgList,
    imgIndex: state.annotation.imgIndex,
  };
};

export default connect(mapStateToProps)(GeneralOperation);
