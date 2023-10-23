import { useState, createRef, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useParams, useRouteLoaderData } from 'react-router';
import _ from 'lodash-es';
import { Spin } from 'antd';
import AnnotationOperation from '@labelu/components';
import type { AnnotatorProps } from '@labelu/video-annotator-react';
import { Annotator } from '@labelu/video-annotator-react';
import { Annotator as AudioAnnotator } from '@labelu/audio-annotator-react';
import '@labelu/components/dist/index.css';
import { useSearchParams } from 'react-router-dom';
import classNames from 'classnames';
import { Bridge } from 'iframe-message-bridge';

import { MediaType, type SampleResponse } from '@/api/types';
import { useScrollFetch } from '@/hooks/useScrollFetch';
import type { getSample } from '@/api/services/samples';
import { getSamples } from '@/api/services/samples';
import { convertVideoConfig } from '@/utils/convertVideoConfig';
import { convertVideoSample } from '@/utils/convertVideoSample';
import type { TaskLoaderResult } from '@/loaders/task.loader';

import currentStyles from './index.module.scss';
import commonController from '../../utils/common';
import SlideLoader, { slideRef } from './components/slideLoader';
import AnnotationRightCorner from './components/annotationRightCorner';
import AnnotationContext from './annotation.context';

export const annotationRef = createRef();
export const videoAnnotationRef = createRef();
export const audioAnnotationRef = createRef();

const AnnotationPage = () => {
  const routeParams = useParams();
  const { task } = useRouteLoaderData('task') as TaskLoaderResult;
  const sample = useRouteLoaderData('annotation') as Awaited<ReturnType<typeof getSample>>;
  const [searchParams] = useSearchParams();
  const taskConfig = _.get(task, 'config');

  const sampleId = routeParams.sampleId;

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
    if (!sample?.data) {
      return [];
    }

    return commonController.transformFileList(sample.data.data, +routeParams.sampleId!);
  }, [sample?.data, routeParams.sampleId]);

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
    if (task?.media_type === MediaType.VIDEO || task?.media_type === MediaType.AUDIO) {
      return convertVideoConfig(taskConfig);
    }

    return {} as AnnotatorProps['config'];
  }, [task?.media_type, taskConfig]);

  const editingSample = useMemo(() => {
    if (task?.media_type === MediaType.IMAGE) {
      return transformed[0];
    } else if (task?.media_type === MediaType.VIDEO || task?.media_type === MediaType.AUDIO) {
      if (!transformed?.[0]) {
        return null;
      }

      return convertVideoSample(sample?.data?.data, routeParams.sampleId, editorConfig, task.media_type);
    }
  }, [editorConfig, routeParams.sampleId, sample?.data, task?.media_type, transformed]);

  const renderSidebar = useMemo(() => {
    return () => leftSiderContent;
  }, [leftSiderContent]);

  // =================== preview config ===================
  const [configFromParent, setConfigFromParent] = useState<any>();
  useLayoutEffect(() => {
    const bridge = new Bridge(window.parent);

    bridge.on('preview', (data) => {
      setConfigFromParent(data);
    });

    bridge.post('ready').catch(() => {});

    return () => bridge.destroy();
  }, []);

  if (task?.media_type === MediaType.IMAGE) {
    content = (
      <AnnotationOperation
        leftSiderContent={leftSiderContent}
        topActionContent={topActionContent}
        loading={loading}
        ref={annotationRef}
        isPreview={false}
        sample={editingSample}
        config={configFromParent || taskConfig}
        isShowOrder={false}
      />
    );
  } else if (task?.media_type === MediaType.VIDEO) {
    content = (
      <Annotator
        primaryColor="#0d53de"
        ref={videoAnnotationRef}
        editingSample={editingSample}
        config={configFromParent || editorConfig}
        toolbarRight={topActionContent}
        renderSidebar={renderSidebar}
      />
    );
  } else if (task?.media_type === MediaType.AUDIO) {
    content = (
      <AudioAnnotator
        primaryColor="#0d53de"
        ref={audioAnnotationRef}
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
      spinning={loading}
    >
      <AnnotationContext.Provider value={annotationContextValue}>
        {!_.isEmpty(transformed) && (!_.isEmpty(taskConfig?.tools) || !_.isEmpty(configFromParent)) && content}
      </AnnotationContext.Provider>
    </Spin>
  );
};
export default AnnotationPage;
