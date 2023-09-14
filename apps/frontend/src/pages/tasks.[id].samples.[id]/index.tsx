import { useState, useEffect, createRef, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash-es';
import { Spin } from 'antd';
import AnnotationOperation from '@label-u/components';
import type { EditorProps } from '@label-u/video-editor-react';
import { Editor } from '@label-u/video-editor-react';
import '@label-u/components/dist/index.css';
import { useSearchParams } from 'react-router-dom';
import classNames from 'classnames';
import { Bridge } from 'iframe-message-bridge';

import type { Dispatch, RootState } from '@/store';
import { MediaType, type SampleResponse } from '@/services/types';
import { useScrollFetch } from '@/hooks/useScrollFetch';
import { getSamples } from '@/services/samples';
import { convertVideoConfig } from '@/utils/convertVideoConfig';
import { convertVideoSample } from '@/utils/convertVideoSample';

import currentStyles from './index.module.scss';
import commonController from '../../utils/common/common';
import SlideLoader, { slideRef } from './components/slideLoader';
import AnnotationRightCorner from './components/annotationRightCorner';
import AnnotationContext from './annotation.context';

export const annotationRef = createRef();
export const videoAnnotationRef = createRef();

const AnnotationPage = () => {
  const routeParams = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<Dispatch>();
  const taskConfig = useSelector((state: RootState) => state.task.config);
  const task = useSelector((state: RootState) => state.task.item);

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

  const leftSiderContent = useMemo(() => <SlideLoader />, []);

  const topActionContent = (
    <AnnotationRightCorner
      isLastSample={isLastSample}
      isFirstSample={isFirstSample}
      noSave={!!searchParams.get('noSave')}
    />
  );

  const annotationContextValue = useMemo(() => {
    return {
      samples,
      setSamples,
      task,
      isEnd: totalCount === samples.length,
    };
  }, [samples, setSamples, task, totalCount]);

  let content = null;

  const editorConfig = useMemo(() => {
    if (task.media_type === MediaType.VIDEO) {
      return convertVideoConfig(taskConfig);
    }

    return {} as EditorProps['config'];
  }, [task.media_type, taskConfig]);

  const editingSample = useMemo(() => {
    if (task.media_type === MediaType.IMAGE) {
      return transformed[0];
    } else if (task.media_type === MediaType.VIDEO) {
      if (!transformed?.[0]) {
        return null;
      }

      return convertVideoSample(sample.data, routeParams.sampleId, editorConfig);
    }
  }, [editorConfig, routeParams.sampleId, sample.data, task.media_type, transformed]);

  const renderSidebar = useMemo(() => {
    return () => leftSiderContent;
  }, [leftSiderContent]);

  // =================== preview config ===================
  const [configFromParent, setConfigFromParent] = useState({} as any);
  useLayoutEffect(() => {
    const bridge = new Bridge(window.parent);

    bridge.on('preview', (data) => {
      setConfigFromParent(data);
    });

    bridge.post('ready');

    return () => {
      bridge.destroy();
    };
  }, []);

  if (task.media_type === MediaType.IMAGE) {
    content = (
      <AnnotationOperation
        leftSiderContent={leftSiderContent}
        topActionContent={topActionContent}
        loading={loading || sampleLoading}
        ref={annotationRef}
        isPreview={false}
        sample={editingSample}
        config={configFromParent || taskConfig}
        isShowOrder={false}
      />
    );
  } else if (task.media_type === MediaType.VIDEO) {
    content = (
      <Editor
        primaryColor="#0d53de"
        ref={videoAnnotationRef}
        editingSample={editingSample}
        config={configFromParent || editorConfig}
        toolbarRight={topActionContent}
        renderSidebar={renderSidebar}
      />
    );
  }

  return (
    <Spin
      wrapperClassName={classNames(currentStyles.annotationPage, {
        [currentStyles.hasHeader]: !searchParams.get('noSave'),
      })}
      spinning={loading || sampleLoading}
    >
      <AnnotationContext.Provider value={annotationContextValue}>
        {!_.isEmpty(transformed) && !_.isEmpty(taskConfig?.tools) && content}
      </AnnotationContext.Provider>
    </Spin>
  );
};
export default AnnotationPage;
