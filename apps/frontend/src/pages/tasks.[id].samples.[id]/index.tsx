import { useState, createRef, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useParams, useRouteLoaderData } from 'react-router';
import _ from 'lodash-es';
import { Empty, Spin, message } from 'antd';
import { Annotator } from '@labelu/video-annotator-react';
import { Annotator as AudioAnnotator } from '@labelu/audio-annotator-react';
import { useSearchParams } from 'react-router-dom';
import { Bridge } from 'iframe-message-bridge';
import type { ImageAnnotatorProps, AnnotatorRef as ImageAnnotatorRef } from '@labelu/image-annotator-react';
import { Annotator as ImageAnnotator } from '@labelu/image-annotator-react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { FlexLayout } from '@labelu/components-react';
import type { ToolName } from '@labelu/image';
import type { ILabel } from '@labelu/interface';

import { MediaType, type SampleResponse } from '@/api/types';
import { useScrollFetch } from '@/hooks/useScrollFetch';
import type { getSample } from '@/api/services/samples';
import { getSamples } from '@/api/services/samples';
import { convertVideoConfig } from '@/utils/convertVideoConfig';
import { convertVideoSample } from '@/utils/convertVideoSample';
import type { TaskLoaderResult } from '@/loaders/task.loader';
import { convertImageConfig } from '@/utils/convertImageConfig';
import { convertImageAnnotations, convertImageSample } from '@/utils/convertImageSample';
import { TOOL_NAME } from '@/constants/toolName';

import SlideLoader from './components/slideLoader';
import AnnotationRightCorner from './components/annotationRightCorner';
import AnnotationContext from './annotation.context';
import { LoadingWrapper, Wrapper } from './style';

type AllToolName = ToolName | 'segment' | 'frame' | 'tag' | 'text';

export const imageAnnotationRef = createRef<ImageAnnotatorRef>();
export const videoAnnotationRef = createRef();
export const audioAnnotationRef = createRef();

const AnnotationPage = () => {
  const routeParams = useParams();
  const { task } = useRouteLoaderData('task') as TaskLoaderResult;
  const sample = (useRouteLoaderData('annotation') as any).sample as Awaited<ReturnType<typeof getSample>>;
  const preAnnotation = (useRouteLoaderData('annotation') as any).preAnnotation;
  const preAnnotationConfig = useMemo(() => {
    const result: Partial<Record<AllToolName, any>> = {};

    if (preAnnotation) {
      const config = _.get(preAnnotation, 'data[0].data[0].config', {});

      Object.keys(config).forEach((key) => {
        const toolName = key.replace(/Tool$/, '') as AllToolName;
        result[toolName] = config[key as keyof typeof config];
      });
    }

    return result;
  }, [preAnnotation]);
  const preAnnotations = useMemo(() => {
    if (preAnnotation) {
      const _annotations = _.get(preAnnotation, 'data[0].data[0].annotations', {});
      return convertImageAnnotations(_annotations, preAnnotationConfig);
    }

    return {};
  }, [preAnnotation, preAnnotationConfig]);

  const [searchParams] = useSearchParams();
  const taskConfig = _.get(task, 'config');
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const sampleId = routeParams.sampleId;

  // TODO： labelu/image中的错误定义
  const onError = useCallback((err: any) => {
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
      message.error(`拉框宽度不可小于${value}`);
    }

    if (err.type === 'minHeight') {
      message.error(`拉框高度不可小于${value}`);
    }
  }, []);

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
  const [samples = [] as SampleResponse[], loading, setSamples] = useScrollFetch(
    fetchSamples,
    () =>
      document.querySelector('.labelu-image__sidebar div') ||
      document.querySelector('.labelu-audio__sidebar div') ||
      document.querySelector('.labelu-video__sidebar div'),
    {
      isEnd: () => totalCount === samples.length,
    },
  );

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
      return convertVideoConfig(taskConfig, preAnnotationConfig);
    }

    return convertImageConfig(taskConfig);
  }, [preAnnotationConfig, task?.media_type, taskConfig]);

  const editingSample = useMemo(() => {
    if (task?.media_type === MediaType.IMAGE) {
      return convertImageSample(sample?.data, editorConfig);
    } else if (task?.media_type === MediaType.VIDEO || task?.media_type === MediaType.AUDIO) {
      return convertVideoSample(sample?.data, editorConfig, task.media_type);
    }
  }, [editorConfig, sample?.data, task?.media_type]);

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

  const config = useMemo(() => {
    return configFromParent || editorConfig;
  }, [configFromParent, editorConfig]);

  const requestEdit = useCallback<NonNullable<ImageAnnotatorProps['requestEdit']>>(
    (editType, { toolName, label }) => {
      if (!toolName) {
        return false;
      }

      const toolConfig = config[toolName];

      if (editType === 'create' && !toolConfig?.labels?.find((item: ILabel) => item.value === label)) {
        message.destroy();
        message.error(`当前工具【${TOOL_NAME[toolName + 'Tool']}】不包含值为【${label}】的标签`);

        return false;
      }

      if (editType === 'edit' && !config[toolName]) {
        message.destroy();
        message.error(`当前配置不存在【${TOOL_NAME[toolName + 'Tool']}】工具`);
        return false;
      }

      return true;
    },
    [config],
  );

  if (task?.media_type === MediaType.IMAGE) {
    content = (
      <ImageAnnotator
        renderSidebar={renderSidebar}
        toolbarRight={topActionContent}
        ref={imageAnnotationRef}
        requestEdit={requestEdit}
        onError={onError}
        offsetTop={configFromParent ? 100 : 156}
        editingSample={editingSample}
        config={config}
        preAnnotationLabels={preAnnotationConfig}
        preAnnotations={preAnnotations}
      />
    );
  } else if (task?.media_type === MediaType.VIDEO) {
    content = (
      <Annotator
        primaryColor="#0d53de"
        ref={videoAnnotationRef}
        offsetTop={configFromParent ? 100 : 156}
        editingSample={editingSample}
        config={config}
        toolbarRight={topActionContent}
        renderSidebar={renderSidebar}
      />
    );
  } else if (task?.media_type === MediaType.AUDIO) {
    content = (
      <AudioAnnotator
        primaryColor="#0d53de"
        ref={audioAnnotationRef}
        offsetTop={configFromParent ? 100 : 156}
        editingSample={editingSample}
        config={config}
        toolbarRight={topActionContent}
        renderSidebar={renderSidebar}
      />
    );
  }

  if (_.isEmpty(sample.data.file)) {
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
