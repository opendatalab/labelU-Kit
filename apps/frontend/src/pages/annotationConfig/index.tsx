import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import AnnotationOperation from '@label-u/components';
import { useDispatch, useSelector } from 'react-redux';

import type { ToolsConfigState } from '@/types/toolConfig';
import { updateAllConfig } from '@/stores/toolConfig.store';

import EmptyConfigImg from '../../img/annotationCommon/emptyConfig.png';
import ConfigTemplate from './configTemplate/index';
import FormConfig from './formConfig';
import { getSamples } from '../../services/samples';
import './index.less';

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
const AnnotationConfig: FC = () => {
  const dispatch = useDispatch();
  const taskId = parseInt(window.location.pathname.split('/')[2]);

  const [fileList, setFileList] = useState<OneFile[]>([defaultFile]);

  useEffect(() => {
    const loadFirstSample = async () => {
      const resp = await getSamples(taskId, { pageNo: 0, pageSize: 1 });
      const data = resp.data;
      const samples = data.data;
      if (samples != null && samples.length > 0) {
        const firstSample = samples[0];

        // bad code
        const urls = firstSample.data.urls;
        if (urls != null) {
          const firstKey = Object.keys(urls)[0];
          const firstUrl = urls[firstKey];

          const oneFile: OneFile = {
            id: 1,
            url: firstUrl,
            result: '{}',
          };
          setFileList([oneFile]);
        }
      }
    };
    loadFirstSample();
  }, [taskId]);

  const [config, setConfig] = useState<ToolsConfigState>({
    tools: [],
    tagList: [],
    attribute: [],
    textConfig: [],
    commonAttributeConfigurable: false,
  });
  const { tools, tagList, attribute, textConfig, commonAttributeConfigurable } = config;

  const updateConfig = useCallback(
    (field: string) => (value: any) => {
      setConfig((prevState) => {
        const newConfig = {
          ...prevState,
          [field]: value,
        };

        // 将config更新到store，以便其他组件使用，但本页面下的组件不要使用store中的数据而使用state中的数据
        dispatch(updateAllConfig(newConfig));

        return newConfig;
      });
    },
    [dispatch],
  );

  const configFromStore = useSelector(
    // @ts-ignore
    (state) => state.toolsConfig,
  );

  useEffect(() => {
    setConfig(configFromStore);
  }, [configFromStore]);

  const [rightImg, setRightImg] = useState<any>();
  const [isConfigError] = useState<boolean>(false);

  const [force, forceSet] = useState(0);
  useEffect(() => {
    // 配置更新表单刷新
    forceSet(new Date().getTime());
  }, [attribute, tagList, textConfig, tools, commonAttributeConfigurable]);

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
          {((fileList && fileList.length > 0 && tools && tools.length > 0) || !rightImg) && !isConfigError ? (
            <>
              <div className="rightHeader">
                <span className="leftSpan">标注预览</span>
              </div>
              <div className="rightContent">
                <AnnotationOperation
                  isPreview={true}
                  attributeList={commonAttributeConfigurable ? attribute : []}
                  tagConfigList={tagList}
                  imgList={fileList}
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
