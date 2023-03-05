import { useState, useEffect, createRef, useMemo } from 'react';
import { useParams } from 'react-router';
import { useSelector } from 'react-redux';
import _ from 'lodash-es';

import type { RootState } from '@/store';
import type { SampleResponse } from '@/services/types';

import Annotation from '../../components/business/annotation';
import currentStyles from './index.module.scss';
import commonController from '../../utils/common/common';
import SlideLoader from './components/slideLoader';
import AnnotationRightCorner from './components/annotationRightCorner';
import AnnotationContext from './annotation.context';

export const annotationRef = createRef();

/**
 * TODO
 * 1. 页内滚动加载，将数据存在本地state
 * 2. SampleGallery context 将样本共享给子组件
 */

const AnnotationPage = () => {
  const routeParams = useParams();
  const [taskSample, setTaskSample] = useState<any>([]);
  const [samples, setSamples] = useState<SampleResponse[]>([]);

  const taskConfig = useSelector((state: RootState) => state.task.config);

  const sampleId = routeParams.sampleId;

  const sample = useSelector((state: RootState) => state.sample.item);

  useEffect(() => {
    if (!sample) {
      return;
    }

    const newSample = commonController.transformFileList(sample.data, sample.id!);
    setTaskSample(newSample);
  }, [sample]);

  const isLastSample = _.findIndex(samples, { id: +sampleId! }) === samples.length - 1;

  const goBack = () => {};
  const leftSiderContent = <SlideLoader />;
  // NOTE: labelu/components包裹了store，在AnnotationRightCorner里获取store不是应用的store！有冲突！
  const topActionContent = <AnnotationRightCorner isLastSample={isLastSample} />;

  const annotationContextValue = useMemo(() => {
    return {
      samples: [],
      setSamples,
    };
  }, []);

  return (
    <AnnotationContext.Provider value={annotationContextValue}>
      <div className={currentStyles.annotationPage}>
        {taskSample && taskSample.length > 0 && taskConfig.tools && taskConfig.tools.length > 0 && (
          <Annotation
            leftSiderContent={leftSiderContent}
            topActionContent={topActionContent}
            annotationRef={annotationRef}
            attribute={taskConfig.attribute}
            tagList={taskConfig.tagList}
            fileList={[{ ...taskSample[0] }]}
            textConfig={taskConfig.textConfig}
            goBack={goBack}
            tools={taskConfig.tools}
            // exportData = {exportData}
            // onSubmit = {onSubmit}
            commonAttributeConfigurable={taskConfig.commonAttributeConfigurable}
          />
        )}
      </div>
    </AnnotationContext.Provider>
  );
};
export default AnnotationPage;
