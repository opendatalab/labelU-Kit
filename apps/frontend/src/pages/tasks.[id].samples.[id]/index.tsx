import { useState, useEffect, createRef, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash-es';
import { Spin } from 'antd';
import AnnotationOperation from '@label-u/components';
import type { EditorProps } from '@label-u/video-editor-react';
import { Editor } from '@label-u/video-editor-react';
import '@label-u/components/dist/index.css';

import type { Dispatch, RootState } from '@/store';
import { MediaType, type SampleResponse } from '@/services/types';
import { useScrollFetch } from '@/hooks/useScrollFetch';
import { getSamples } from '@/services/samples';
import { jsonParse } from '@/utils';

import currentStyles from './index.module.scss';
import commonController from '../../utils/common/common';
import SlideLoader, { slideRef } from './components/slideLoader';
import AnnotationRightCorner from './components/annotationRightCorner';
import AnnotationContext from './annotation.context';

export const annotationRef = createRef();
export const videoAnnotationRef = createRef();

const AnnotationPage = () => {
  const routeParams = useParams();
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
  const topActionContent = <AnnotationRightCorner isLastSample={isLastSample} isFirstSample={isFirstSample} />;

  const annotationContextValue = useMemo(() => {
    return {
      samples,
      setSamples,
      task,
      isEnd: totalCount === samples.length,
    };
  }, [samples, setSamples, task, totalCount]);

  let content = null;

  const editingSample = useMemo(() => {
    if (task.media_type === MediaType.IMAGE) {
      return transformed[0];
    } else if (task.media_type === MediaType.VIDEO) {
      if (!transformed?.[0]) {
        return null;
      }

      const parsedResult = jsonParse(transformed[0].result);

      const segments = _.chain(parsedResult)
        .get('videoSegmentTool', [])
        .map((item) => {
          return {
            ...item,
            type: 'segment',
          };
        })
        .value();
      const frames = _.chain(parsedResult)
        .get('videoFrameTool', [])
        .map((item) => {
          return {
            ...item,
            type: 'frame',
          };
        })
        .value();
      const texts = _.chain(parsedResult)
        .get('textTool', [])
        .map((item) => {
          return {
            ...item,
            type: 'text',
          };
        })
        .value();

      const tags = _.chain(parsedResult)
        .get('tagTool', [])
        .map((item) => {
          return {
            ...item,
            type: 'tag',
          };
        })
        .value();

      return {
        ...transformed[0],
        annotations: [...segments, ...frames, ...texts, ...tags],
      };
    }
  }, [task.media_type, transformed]);

  const renderSidebar = useMemo(() => {
    return () => leftSiderContent;
  }, [leftSiderContent]);

  if (task.media_type === MediaType.IMAGE) {
    content = (
      <AnnotationOperation
        leftSiderContent={leftSiderContent}
        topActionContent={topActionContent}
        loading={loading || sampleLoading}
        ref={annotationRef}
        isPreview={false}
        sample={editingSample}
        config={taskConfig}
        isShowOrder={false}
      />
    );
  } else if (task.media_type === MediaType.VIDEO) {
    const editorConfig: EditorProps['config'] = {
      segment: {
        type: 'segment',
      },
      frame: {
        type: 'frame',
      },
    };

    taskConfig.tools.forEach((item) => {
      if (item.tool === 'videoSegmentTool') {
        editorConfig.segment = {
          ...editorConfig.segment,
          ...item.config,
        };

        if (taskConfig.attributes) {
          if (!editorConfig.segment.attributes) {
            editorConfig.segment.attributes = [];
          }

          editorConfig.segment.attributes = taskConfig.attributes.concat(editorConfig.segment.attributes);
        }
      }

      if (item.tool === 'videoFrameTool') {
        editorConfig.frame = {
          ...editorConfig.frame,
          ...item.config,
        };

        if (taskConfig.attributes) {
          if (!editorConfig.frame.attributes) {
            editorConfig.frame.attributes = [];
          }

          editorConfig.frame.attributes = taskConfig.attributes.concat(editorConfig.frame.attributes);
        }
      }

      if (item.tool === 'tagTool') {
        editorConfig.tag = item.config.attributes;
      }

      if (item.tool === 'textTool') {
        editorConfig.text = item.config.attributes;
      }
    });

    content = (
      <Editor
        primaryColor="#0d53de"
        ref={videoAnnotationRef}
        editingSample={editingSample}
        config={editorConfig}
        toolbarRight={topActionContent}
        renderSidebar={renderSidebar}
      />
    );
  }

  return (
    <Spin wrapperClassName={currentStyles.annotationPage} spinning={loading || sampleLoading}>
      <AnnotationContext.Provider value={annotationContextValue}>
        {!_.isEmpty(transformed) && !_.isEmpty(taskConfig.tools) && content}
      </AnnotationContext.Provider>
    </Spin>
  );
};
export default AnnotationPage;
