import { useState, createRef, useMemo, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { useParams, useRouteLoaderData } from 'react-router';
import _ from 'lodash-es';
import { Empty, Spin, message } from 'antd';
import { Annotator } from '@labelu/video-annotator-react';
import { Annotator as AudioAnnotator } from '@labelu/audio-annotator-react';
import { useSearchParams } from 'react-router-dom';
import { Bridge } from 'iframe-message-bridge';
import type { AnnotatorRef as ImageAnnotatorRef } from '@labelu/image-annotator-react';
import { Annotator as ImageAnnotator } from '@labelu/image-annotator-react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { FlexLayout } from '@labelu/components-react';

import { MediaType, type SampleResponse } from '@/api/types';
import { useScrollFetch } from '@/hooks/useScrollFetch';
import type { getSample } from '@/api/services/samples';
import { getSamples } from '@/api/services/samples';
import { convertVideoConfig } from '@/utils/convertVideoConfig';
import { convertVideoSample } from '@/utils/convertVideoSample';
import type { TaskLoaderResult } from '@/loaders/task.loader';
import { convertImageConfig } from '@/utils/convertImageConfig';
import { convertImageSample } from '@/utils/convertImageSample';

import commonController from '../../utils/common';
import SlideLoader, { slideRef } from './components/slideLoader';
import AnnotationRightCorner from './components/annotationRightCorner';
import AnnotationContext from './annotation.context';
import { LoadingWrapper, Wrapper } from './style';

export const imageAnnotationRef = createRef<ImageAnnotatorRef>();
export const videoAnnotationRef = createRef();
export const audioAnnotationRef = createRef();

const AnnotationPage = () => {
  const routeParams = useParams();
  const { task } = useRouteLoaderData('task') as TaskLoaderResult;
  const sample = useRouteLoaderData('annotation') as Awaited<ReturnType<typeof getSample>>;
  const [searchParams] = useSearchParams();
  const taskConfig = _.get(task, 'config');
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const sampleId = routeParams.sampleId;

  useEffect(() => {
    const engine = imageAnnotationRef.current?.getEngine();

    // TODO： labelu/image中的错误定义
    const handleError = (err: any) => {
      const value = err.value;

      if (err.type === 'rotate') {
        message.error('有标注数据时不可旋转图片');
      }

      if (err.type === 'minPointAmount') {
        message.error(`最少点数不能小于${value}个`);
      }

      if (err.type === 'maxPointAmount') {
        message.error(`点数最多不能大于${value}个`);
      }

      if (err.type === 'minWidth') {
        message.error('拉框宽度不满足要求');
      }

      if (err.type === 'minHeight') {
        message.error('拉框高度不满足要求');
      }
    };

    engine?.on('error', handleError);

    return () => {
      engine?.off('error', handleError);
    };
  });

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

    return convertImageConfig(taskConfig);
  }, [task?.media_type, taskConfig]);

  const editingSample = useMemo(() => {
    if (task?.media_type === MediaType.IMAGE) {
      return convertImageSample(sample?.data?.data, routeParams.sampleId, editorConfig);
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

  const isLoading = useMemo(() => loading || isFetching > 0 || isMutating > 0, [loading, isFetching, isMutating]);

  if (task?.media_type === MediaType.IMAGE) {
    content = (
      <ImageAnnotator
        renderSidebar={renderSidebar}
        toolbarRight={topActionContent}
        ref={imageAnnotationRef}
        offsetTop={156}
        editingSample={editingSample}
        config={configFromParent || editorConfig}
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

  if (_.isEmpty(transformed)) {
    return (
      <FlexLayout.Content items="center" justify="center" flex>
        <Empty description="无样本数据" />
      </FlexLayout.Content>
    );
  }

  if (_.isEmpty(taskConfig?.tools) && _.isEmpty(configFromParent)) {
    return (
      <FlexLayout.Content items="center" justify="center" flex>
        <Empty description="无标注工具" />
      </FlexLayout.Content>
    );
  }

  return (
    <AnnotationContext.Provider value={annotationContextValue}>
      {isLoading && (
        <LoadingWrapper items="center" justify="center" flex>
          <Spin spinning />
        </LoadingWrapper>
      )}
      <Wrapper flex="column" full loading={isLoading}>
        {content}
      </Wrapper>
    </AnnotationContext.Provider>
  );
};
export default AnnotationPage;
