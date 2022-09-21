import AnnotationOperation, { TextConfig } from '@label-u/lb-components';

import '@label-u/lb-components/dist/index.css';
// import LeftSider from './leftSider';
import { BasicConfig, Attribute, OneTag } from 'interface/toolConfig';
import { memo } from 'react';
// import tagConfigList from '../../../config/tagConfigList.json';
// import attributeList from '../../../config/attributeList.json';

const Annotation = (props: {
  fileList: any;
  goBack: (data: any) => void;
  tools: BasicConfig[];
  tagList: OneTag[];
  attribute: Attribute[];
  textConfig: TextConfig;
}) => {
  const { fileList, goBack, tools, tagList, attribute, textConfig } = props;
  const exportData = (data: any) => {
    console.log('exportData', data);
  };
  const onSubmit = (data: any) => {
    // 翻页时触发当前页面数据的输出
    console.log('submitData', data);
  };
  const onSave = (data: any, imgList: any, index: any) => {
    console.log('save', data, imgList, index);
  };
  return (
    <div>
      <AnnotationOperation
        // ref={annotationRef}
        exportData={exportData}
        // headerName="测试各类工具"
        onSubmit={onSubmit}
        imgList={fileList}
        // pageSize={10}
        // leftSider={LeftSider}
        attributeList={attribute}
        tagConfigList={tagList}
        toolsBasicConfig={tools}
        textConfig={textConfig}
        // header={header}
        // showTips={true}
        // loadFileList={loadFileList}
        goBack={goBack}
        // stepList={stepList}
        // step={step}
        onSave={onSave}
        // dataInjectionAtCreation={dataInjectionAtCreation}
        // defaultLang={'cn'}
        // currentToolName={''} // renderEnhance={renderEnhance}
      />
    </div>
  );
};
export default memo(Annotation);
