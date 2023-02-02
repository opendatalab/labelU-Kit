import type { FC } from 'react';
import { useEffect, useState } from 'react';

import Annotation from '../../components/business/annotation';

import AnnotationOperation from '@label-u/components';

import './index.less';
import { shallowEqual, useSelector } from 'react-redux';
import type { ToolsConfigState } from 'interface/toolConfig';
import { Button, Steps, Tabs } from 'antd';

import YamlConfig from './yamlConfig';
import EmptyConfigImg from '../../img/annotationCommon/emptyConfig.png';
import ConfigTemplate from './configTemplate/index';
import FormConfig from './formConfig';
import { getSamples } from '../../services/samples';

const { Step } = Steps;

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
  }, []);

  useEffect(() => {
    // run during mount

    return () => {
      // run during umount
      console.log('AnnotationConfig umounted');
    };
  }, []);

  // for future test only
  const [config, setConfig] = useState<ToolsConfigState>({
    tools: [],
    tagList: [],
    attribute: [],
    textConfig: [],
    commonAttributeConfigurable: false,
  });

  const { tools, tagList, attribute, textConfig, commonAttributeConfigurable } = useSelector(
    (state) => state.toolsConfig,
    shallowEqual,
  );
  const [rightImg, setRightImg] = useState<any>();
  const [isConfigError, setIsConfigError] = useState<boolean>(false);

  const [force, forceSet] = useState(0);

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

  useEffect(() => {
    // 配置更新表单刷新
    forceSet(new Date().getTime());
  }, [attribute, tagList, textConfig, tools, commonAttributeConfigurable]);

  const goBack = (data: any) => {};

  const doSetImage = (img: any, isError: boolean) => {
    setRightImg(img);
    setIsConfigError(isError);
  };

  const extraContent = {
    left: <span className="leftTabContent">标注配置</span>,
    right: <ConfigTemplate />,
  };
  return (
    <div className="container">
      {/*<div className="headerBox">*/}
      {/*  <div className="stepBox">*/}
      {/*    <Steps size="small" current={2}>*/}
      {/*      <Step title="基础配置" />*/}
      {/*      <Step title="数据导入" />*/}
      {/*      <Step title="标注配置" />*/}
      {/*    </Steps>*/}
      {/*  </div>*/}
      {/*  <div className="submitBox">*/}
      {/*    <Button>取消</Button>*/}
      {/*    <Button*/}
      {/*      type="primary"*/}
      {/*      onClick={e => {*/}
      {/*        e.stopPropagation();*/}
      {/*      }}*/}
      {/*    >*/}
      {/*      完成*/}
      {/*    </Button>*/}
      {/*  </div>*/}
      {/*</div>*/}
      <div className="configBox">
        <div className="leftSider" id="lefeSiderId">
          <div className="leftSiderTitle">
            <span className="leftTabContent">标注配置</span>
            <ConfigTemplate />
          </div>
          <div className="leftPane">
            <FormConfig key={force} config={config} setConfig={setConfig} />
          </div>

          {/*<Tabs*/}
          {/*  defaultActiveKey="2"*/}
          {/*  tabBarExtraContent={extraContent}*/}
          {/*  type="card"*/}
          {/*  onChange={e => {*/}
          {/*    forceSet(new Date().getTime());*/}
          {/*  }}*/}
          {/*>*/}
          {/*  <Tabs.TabPane tab="YAML" key="1">*/}
          {/*    <div className="leftPane">*/}
          {/*      <YamlConfig toolsConfigState={confitState} doSetImg={doSetImage} key={force} />*/}
          {/*    </div>*/}
          {/*  </Tabs.TabPane>*/}
          {/*  <Tabs.TabPane tab="可视化" key="2" forceRender={true}>*/}
          {/*    <div className="leftPane">*/}
          {/*      <FormConfig key={force} />*/}
          {/*    </div>*/}
          {/*  </Tabs.TabPane>*/}
          {/*</Tabs>*/}
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
