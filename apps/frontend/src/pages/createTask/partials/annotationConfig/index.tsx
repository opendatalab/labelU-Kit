import { useMemo, useEffect, useState, useCallback, useContext } from 'react';
import AnnotationOperation from '@label-u/components';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash-es';

import type { Dispatch, RootState } from '@/store';
import EmptyConfigImg from '@/img/annotationCommon/emptyConfig.png';

import ConfigTemplate from './configTemplate/index';
import FormConfig from './formConfig';
import './index.scss';
import { TaskCreationContext } from '../../taskCreation.context';

interface OneFile {
  id: number;
  url: string;
  result: string;
}

const defaultFile: OneFile = {
  id: 1,
  url: '/src/img/example/bear4.webp',
  result: '{}',
};

// 配置页的config统一使用此组件的state
const AnnotationConfig = () => {
  const dispatch = useDispatch<Dispatch>();
  const { updateFormData, formData, task = {} } = useContext(TaskCreationContext);
  const taskId = task.id;

  const samples = useSelector((state: RootState) => state.sample.list);
  const {
    config = {
      tools: [],
      tagList: [],
      attribute: [],
      textConfig: [],
      commonAttributeConfigurable: false,
    },
  } = formData;

  const { tools, tagList, attribute, textConfig, commonAttributeConfigurable } = config || {};

  const headSample = useMemo(() => _.chain(samples).get('data').head().value(), [samples]);
  const previewFiles = useMemo(() => {
    const id = _.chain(headSample).get('data.fileNames').keys().head().value();
    if (!id) {
      return [defaultFile];
    }

    return [
      {
        id,
        url: _.get(headSample, `data.urls.${id}`),
        result: _.get(headSample, `data.result`),
      },
    ];
  }, [headSample]);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    dispatch.sample.fetchSamples({
      task_id: taskId,
      pageNo: 1,
      pageSize: 1,
    });
  }, [dispatch.sample, taskId]);

  const updateConfig = useCallback(
    (field: string) => (value: any) => {
      updateFormData(`config.${field}`)(value);
    },
    [updateFormData],
  );

  const [rightImg, setRightImg] = useState<any>();
  const [isConfigError] = useState<boolean>(false);

  useEffect(() => {
    // 初始化配置防抖方法
    const throttle = (fun: () => void, time: number) => {
      let timmer: any;
      const returnFunction = () => {
        if (timmer) {
          clearTimeout(timmer);
        }
        timmer = setTimeout(() => {
          fun();
        }, time);
      };
      return returnFunction;
    };
    // @ts-ignore
    window.throttle = throttle;
    setRightImg(EmptyConfigImg);
  }, []);

  const goBack = () => {};

  return (
    <div className="container">
      <div className="configBox">
        <div className="leftSider" id="lefeSiderId">
          <div className="leftSiderTitle">
            <span className="leftTabContent">标注配置</span>
            <ConfigTemplate />
          </div>
          <div className="leftPane">
            <FormConfig config={config} updateConfig={updateConfig} />
          </div>
        </div>
        <div className="rightSider">
          {((tools && tools.length > 0) || !rightImg) && !isConfigError ? (
            <>
              <div className="rightHeader">
                <span className="leftSpan">标注预览</span>
              </div>
              <div className="rightContent">
                <AnnotationOperation
                  isPreview={true}
                  attributeList={commonAttributeConfigurable ? attribute : []}
                  tagConfigList={tagList}
                  imgList={previewFiles}
                  textConfig={textConfig}
                  goBack={goBack}
                  toolsBasicConfig={tools}
                />
              </div>
            </>
          ) : (
            <div className="notMatchBox">
              <img alt="not match config" src={rightImg} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnotationConfig;
