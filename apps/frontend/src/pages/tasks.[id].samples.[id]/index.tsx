import { useState, createRef, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useParams, useRouteLoaderData } from 'react-router';
import _ from 'lodash-es';
import { Empty, Spin, message } from 'antd';
import { Annotator } from '@labelu/video-annotator-react';
import type { AudioAndVideoAnnotatorRef } from '@labelu/audio-annotator-react';
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
import { convertAudioAndVideoConfig } from '@/utils/convertAudioAndVideoConfig';
import { convertAudioAndVideoSample, convertMediaAnnotations } from '@/utils/convertAudioAndVideoSample';
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
export const videoAnnotationRef = createRef<AudioAndVideoAnnotatorRef>();
export const audioAnnotationRef = createRef<AudioAndVideoAnnotatorRef>();

const AnnotationPage = () => {
  const routeParams = useParams();
  const { task } = useRouteLoaderData('task') as TaskLoaderResult;
  const sample = (useRouteLoaderData('annotation') as any).sample as Awaited<ReturnType<typeof getSample>>;
  const preAnnotation = (useRouteLoaderData('annotation') as any).preAnnotation;

  const preAnnotationConfig = useMemo(() => {
    const result: Partial<Record<AllToolName, any>> = {};

    if (preAnnotation) {
      const preAnnotationResult = JSON.parse(_.get(preAnnotation, 'data[0].data', 'null'));

      if (!preAnnotationResult) {
        return {};
      }

      const config = preAnnotationResult.config;

      if (!config) {
        return {};
      }

      Object.keys(preAnnotationResult.config).forEach((key) => {
        let toolName = key.replace(/Tool$/, '') as AllToolName;

        if (key.includes('audio') || key.includes('video')) {
          // audioSegmentTool => segment
          toolName = toolName.replace(/audio|video/, '').toLowerCase() as AllToolName;
        }

        result[toolName] = preAnnotationResult.config[key as keyof typeof config];
      });
    }

    return result;
  }, [preAnnotation]);
  const preAnnotations = useMemo(() => {
    if (!preAnnotation) {
      return {};
    }

    const preAnnotationResult = JSON.parse(_.get(preAnnotation, 'data[0].data', 'null'));
    let _annotations = _.get(preAnnotationResult, 'annotations', {});
    const preAnnotationFile = _.get(preAnnotation, 'data[0].file', {});
    // 兼容json预标注
    if (preAnnotationFile.filename?.endsWith('.json')) {
      _annotations = _.chain(preAnnotationResult)
        .get('result.annotations')
        .map((item) => {
          return [
            item.toolName,
            {
              toolName: item.toolName,
              result: item.result,
            },
          ];
        })
        .fromPairs()
        .value();
    }

    if (task?.media_type === MediaType.IMAGE) {
      return convertImageAnnotations(_annotations, preAnnotationConfig);
    } else if (task?.media_type === MediaType.VIDEO || task?.media_type === MediaType.AUDIO) {
      return convertMediaAnnotations(task.media_type, _annotations, preAnnotationConfig);
    }

    return {};
  }, [preAnnotation, preAnnotationConfig, task?.media_type]);

  const [searchParams] = useSearchParams();
  const taskConfig = _.get(task, 'config');
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

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
  const [samples = [] as SampleResponse[], loading, setSamples, svc] = useScrollFetch(
    fetchSamples,
    () =>
      document.querySelector('.labelu-image__sidebar div') ||
      document.querySelector('.labelu-audio__sidebar div') ||
      document.querySelector('.labelu-video__sidebar div'),
    {
      isEnd: () => totalCount === samples.length,
    },
  );

  const leftSiderContent = useMemo(() => <SlideLoader />, []);

  const topActionContent = (
    <AnnotationRightCorner totalSize={totalCount} fetchNext={svc} noSave={!!searchParams.get('noSave')} />
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
      return convertAudioAndVideoConfig(taskConfig);
    }

    return convertImageConfig(taskConfig);
  }, [task?.media_type, taskConfig]);

  const editingSample = useMemo(() => {
    if (task?.media_type === MediaType.IMAGE) {
      return convertImageSample(sample?.data, editorConfig);
    } else if (task?.media_type === MediaType.VIDEO || task?.media_type === MediaType.AUDIO) {
      return convertAudioAndVideoSample(sample?.data, editorConfig, task.media_type);
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
      const toolNameKey =
        (toolName.includes('frame') || toolName.includes('segment')
          ? task!.media_type?.toLowerCase() + _.upperFirst(toolName)
          : toolName) + 'Tool';

      if (editType === 'create' && !toolConfig?.labels?.find((item: ILabel) => item.value === label)) {
        message.destroy();
        message.error(`当前工具【${TOOL_NAME[toolNameKey]}】不包含值为【${label}】的标签`);

        return false;
      }

      if (editType === 'update' && !config[toolName]) {
        message.destroy();
        message.error(`当前配置不存在【${TOOL_NAME[toolNameKey]}】工具`);
        return false;
      }

      return true;
    },
    [config, task],
  );

  const [currentTool, setCurrentTool] = useState<any>();
  const [labelMapping, setLabelMapping] = useState<Record<any, string>>();

  const handleLabelChange = useCallback((toolName: any, label: ILabel) => {
    // 缓存当前标签
    setLabelMapping((prev) => {
      return {
        ...prev,
        [toolName]: label.value,
      };
    });
  }, []);

  const handleToolChange = useCallback((toolName: any) => {
    setCurrentTool(toolName);
  }, []);

  const currentLabel = useMemo(() => {
    return labelMapping?.[currentTool];
  }, [currentTool, labelMapping]);

  if (task?.media_type === MediaType.IMAGE) {
    content = (
      <ImageAnnotator
        renderSidebar={renderSidebar}
        toolbarRight={topActionContent}
        ref={imageAnnotationRef}
        onError={onError}
        offsetTop={configFromParent ? 100 : 156}
        editingSample={editingSample}
        config={config}
        requestEdit={requestEdit}
        onLabelChange={handleLabelChange}
        onToolChange={handleToolChange}
        selectedTool={currentTool}
        selectedLabel={currentLabel}
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
        requestEdit={requestEdit}
        onLabelChange={handleLabelChange}
        onToolChange={handleToolChange}
        selectedTool={currentTool}
        selectedLabel={currentLabel}
        preAnnotationLabels={preAnnotationConfig}
        preAnnotations={preAnnotations}
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
        requestEdit={requestEdit}
        onLabelChange={handleLabelChange}
        onToolChange={handleToolChange}
        selectedTool={currentTool}
        selectedLabel={currentLabel}
        preAnnotationLabels={preAnnotationConfig}
        preAnnotations={preAnnotations}
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

  console.log(editingSample);

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
