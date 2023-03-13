import { useState, useEffect, createRef, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash-es';
import { Spin } from 'antd';

import type { Dispatch, RootState } from '@/store';
import type { SampleResponse } from '@/services/types';
import { useScrollFetch } from '@/hooks/useScrollFetch';
import { getSamples } from '@/services/samples';

import Annotation from '../../components/business/annotation';
import currentStyles from './index.module.scss';
import commonController from '../../utils/common/common';
import SlideLoader, { slideRef } from './components/slideLoader';
import AnnotationRightCorner from './components/annotationRightCorner';
import AnnotationContext from './annotation.context';

export const annotationRef = createRef();

const AnnotationPage = () => {
  const routeParams = useParams();
  const dispatch = useDispatch<Dispatch>();
  const taskConfig = useSelector((state: RootState) => state.task.config);

  const sampleId = routeParams.sampleId;

  const sample = useSelector((state: RootState) => state.sample.item);

  // 滚动加载
  const [totalCount, setTotalCount] = useState<number>(0);
  const currentPage = useRef<number>(1);
  const fetchSamples = useCallback(async () => {
    if (!routeParams.taskId) {
      return Promise.resolve([]);
    }

    const { data, meta_data } = await getSamples({
      task_id: +routeParams.taskId!,
      pageNo: currentPage.current,
      pageSize: 40,
    });

    currentPage.current += 1;
    setTotalCount(meta_data?.total ?? 0);

    return data;
  }, [routeParams.taskId]);
  const [samples = [] as SampleResponse[], loading, setSamples] = useScrollFetch(fetchSamples, slideRef.current!, {
    isEnd: () => totalCount === samples.length,
  });

  const transformed = useMemo(() => {
    return commonController.transformFileList(sample.data, sample.id!);
  }, [sample.data, sample.id]);

  useEffect(() => {
    dispatch.task.fetchTask(+routeParams.taskId!);
  }, [dispatch.task, routeParams.taskId]);

  const isLastSample = _.findIndex(samples, { id: +sampleId! }) === samples.length - 1;

  const goBack = () => {};
  const leftSiderContent = <SlideLoader />;
  // NOTE: labelu/components包裹了store，在AnnotationRightCorner里获取store不是应用的store！有冲突！
  const topActionContent = <AnnotationRightCorner isLastSample={isLastSample} />;

  const annotationContextValue = useMemo(() => {
    return {
      samples,
      setSamples,
      isEnd: totalCount === samples.length,
    };
  }, [samples, setSamples, totalCount]);

  return (
    <Spin className={currentStyles.annotationPage} spinning={loading} style={{ height: '100%' }}>
      <AnnotationContext.Provider value={annotationContextValue}>
        {!_.isEmpty(transformed) && !_.isEmpty(taskConfig.tools) && (
          <Annotation
            leftSiderContent={leftSiderContent}
            topActionContent={topActionContent}
            annotationRef={annotationRef}
            attribute={taskConfig.attribute}
            tagList={taskConfig.tagList}
            fileList={[{ ...transformed[0] }]}
            textConfig={taskConfig.textConfig}
            goBack={goBack}
            tools={taskConfig.tools}
            commonAttributeConfigurable={taskConfig.commonAttributeConfigurable}
          />
        )}
      </AnnotationContext.Provider>
    </Spin>
  );
};
export default AnnotationPage;
