import type { TextConfig } from '@label-u/components';
import AnnotationOperation from '@label-u/components';

import '@label-u/components/dist/index.css';
// import LeftSider from './leftSider';
import type { BasicConfig, Attribute, OneTag } from 'interface/toolConfig';
import React, { memo, useEffect, useState } from 'react';
// import tagConfigList from '../../../config/tagConfigList.json';
// import attributeList from '../../../config/attributeList.json';
import { createRef } from 'react';

const Annotation = (props: {
  fileList: any;
  goBack: (data: any) => void;
  tools: BasicConfig[];
  tagList: OneTag[];
  attribute: Attribute[];
  textConfig: TextConfig;
  isPreview?: boolean;
  leftSiderContent?: any;
  topActionContent?: any;
  onSubmit?: any;
  exportData?: any;
  annotationRef?: any;
  commonAttributeConfigurable?: boolean;
}) => {
  const {
    fileList,
    goBack,
    tools,
    tagList,
    attribute,
    textConfig,
    isPreview,
    leftSiderContent,
    topActionContent,
    exportData,
    onSubmit,
    annotationRef,
    commonAttributeConfigurable,
  } = props;
  // const exportData = (data: any) => {
  // };
  // const onSubmit = (data: any) => {
  //   // 翻页时触发当前页面数据的输出
  // };
  // const leftSiderContent = ()=>{
  //   return (<div>test 22</div>)
  // };
  // const topActionContent = ()=>{
  //   return <div>test action</div>
  // };
  // @ts-ignore
  return (
    <div style={{ width: '100vw' }}>
      <AnnotationOperation
        leftSiderContent={leftSiderContent}
        topActionContent={topActionContent}
        ref={annotationRef}
        isPreview={isPreview}
        // exportData={exportData}
        // onSubmit={onSubmit}
        imgList={fileList}
        attributeList={commonAttributeConfigurable ? attribute : []}
        tagConfigList={tagList}
        toolsBasicConfig={tools}
        textConfig={textConfig}
        isShowOrder={false}
        // commonAttributeConfigurable ={co}
      />
    </div>
  );
};
export default memo(Annotation);
