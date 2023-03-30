import { useState, useEffect, createRef, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash-es';
import { Spin } from 'antd';
import AnnotationOperation from '@label-u/components';
import '@label-u/components/dist/index.css';
import { EToolName } from '@label-u/annotation';

import type { Dispatch, RootState } from '@/store';
import type { SampleResponse } from '@/services/types';
import { useScrollFetch } from '@/hooks/useScrollFetch';
import { getSamples } from '@/services/samples';

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
  const sampleLoading = useSelector((state: RootState) => state.loading.models.sample);

  useEffect(() => {
    if (routeParams.sampleId) {
      dispatch.sample.fetchSample({
        task_id: +routeParams.taskId!,
        sample_id: +routeParams.sampleId!,
      });
    }
  }, [dispatch.sample, routeParams.sampleId, routeParams.taskId]);

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
    if (!sample.data) {
      return [];
    }

    return commonController.transformFileList(sample.data, +routeParams.sampleId!);
  }, [sample.data, routeParams.sampleId]);

  useEffect(() => {
    dispatch.task.fetchTask(+routeParams.taskId!);
  }, [dispatch.task, routeParams.taskId]);

  const isLastSample = _.findIndex(samples, { id: +sampleId! }) === samples.length - 1;
  const isFirstSample = _.findIndex(samples, { id: +sampleId! }) === 0;

  const leftSiderContent = <SlideLoader />;
  // NOTE: labelu/components包裹了store，在AnnotationRightCorner里获取store不是应用的store！有冲突！
  const topActionContent = <AnnotationRightCorner isLastSample={isLastSample} isFirstSample={isFirstSample} />;

  const annotationContextValue = useMemo(() => {
    return {
      samples,
      setSamples,
      isEnd: totalCount === samples.length,
    };
  }, [samples, setSamples, totalCount]);

  const textConfig = useMemo(() => {
    return _.chain(taskConfig).get('tools').find({ tool: EToolName.Text }).get('config.texts').value();
  }, [taskConfig]);

  const tagConfigList = useMemo(() => {
    return _.chain(taskConfig).get('tools').find({ tool: EToolName.Tag }).get('config.tags').value();
  }, [taskConfig]);

  return (
    <Spin className={currentStyles.annotationPage} spinning={loading || sampleLoading} style={{ height: '100%' }}>
      <AnnotationContext.Provider value={annotationContextValue}>
        {!_.isEmpty(transformed) && !_.isEmpty(taskConfig.tools) && (
          <AnnotationOperation
            leftSiderContent={leftSiderContent}
            topActionContent={topActionContent}
            loading={loading || sampleLoading}
            ref={annotationRef}
            isPreview={false}
            imgList={[transformed[0]]}
            sample={transformed[0]}
            attributeList={taskConfig.commonAttributeConfigurable ? taskConfig.attributes : []}
            tagConfigList={tagConfigList}
            config={taskConfig}
            toolsBasicConfig={taskConfig.tools}
            textConfig={textConfig}
            isShowOrder={false}
          />
        )}
      </AnnotationContext.Provider>
    </Spin>
  );
};
export default AnnotationPage;
