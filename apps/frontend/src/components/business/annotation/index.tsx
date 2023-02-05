import type { TextConfig } from '@label-u/components';
import AnnotationOperation from '@label-u/components';
import '@label-u/components/dist/index.css';
import { memo } from 'react';

import type { BasicConfig, Attribute, OneTag } from '@/interface/toolConfig';

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
    tools,
    tagList,
    attribute,
    textConfig,
    isPreview,
    leftSiderContent,
    topActionContent,
    annotationRef,
    commonAttributeConfigurable,
  } = props;
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
