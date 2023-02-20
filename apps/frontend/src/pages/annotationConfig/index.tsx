import type { FC } from 'react';
import { useEffect, useState } from 'react';
import AnnotationOperation from '@label-u/components';
import { shallowEqual, useSelector } from 'react-redux';

import type { ToolsConfigState } from '@/types/toolConfig';

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

const AnnotationConfig: FC = () => {
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

  // for future test only
  const [config, setConfig] = useState<ToolsConfigState>({
    tools: [],
    tagList: [],
    attribute: [],
    textConfig: [],
    commonAttributeConfigurable: false,
  });

  const { tools, tagList, attribute, textConfig, commonAttributeConfigurable } = useSelector(
    // @ts-ignore
    (state) => state.toolsConfig,
    shallowEqual,
  );
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
            <FormConfig key={force} config={config} setConfig={setConfig} />
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
