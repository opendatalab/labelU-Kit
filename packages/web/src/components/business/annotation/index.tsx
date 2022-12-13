import AnnotationOperation, { TextConfig } from '@label-u/components';

import '@label-u/components/dist/index.css';
// import LeftSider from './leftSider';
import { BasicConfig, Attribute, OneTag } from 'interface/toolConfig';
import { memo, useRef } from 'react';
// import tagConfigList from '../../../config/tagConfigList.json';
// import attributeList from '../../../config/attributeList.json';
import './index.less';

const Annotation = (props: {
  fileList: any;
  goBack: (data: any) => void;
  tools: BasicConfig[];
  tagList: OneTag[];
  attribute: Attribute[];
  textConfig: TextConfig;
  isPreview?: boolean;
  leftSiderContent?: React.ReactNode | React.ReactNode;
  topActionContent?: React.ReactNode | React.ReactNode;
}) => {
  const { fileList, goBack, tools, tagList, attribute, textConfig, isPreview,leftSiderContent,topActionContent } = props;
  const annotationRef = useRef<any>();

  const exportData = (data: any) => {
    // console.log('exportData', data);
  };
   // 标注页面变动时主动上报当前页面数据的标注结果数据
  const onSubmit = (data: any) => {
    console.log('submitData', data);
  };
  // 被动请求方式
  const getLabelResult = ()=>{
    const reulst = annotationRef?.current?.getResult()
    console.log(reulst);
  }

  return (
    <div className='annotationBox'>
      <button className='btn btn-primary' onClick={getLabelResult}> 获取本张结果</button>
      <AnnotationOperation
        ref={annotationRef}
        leftSiderContent={leftSiderContent}
        topActionContent={topActionContent}      
        isPreview = {isPreview}
        exportData={exportData}
        onSubmit={onSubmit}
        imgList={fileList}
        attributeList={attribute}
        tagConfigList={tagList}
        toolsBasicConfig={tools}
        textConfig={textConfig}
        isShowOrder={false}
      />
    </div>
  );
};
export default memo(Annotation);
