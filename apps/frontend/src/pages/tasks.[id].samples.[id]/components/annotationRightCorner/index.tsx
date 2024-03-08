import { useEffect, useCallback, useContext } from 'react';
import { useNavigate, useParams, useRevalidator } from 'react-router';
import { Button } from 'antd';
import _, { debounce } from 'lodash-es';
import { set, omit } from 'lodash/fp';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSearchParams } from 'react-router-dom';
import { FlexLayout } from '@labelu/components-react';

import commonController from '@/utils/common';
import { imageAnnotationRef, videoAnnotationRef, audioAnnotationRef } from '@/pages/tasks.[id].samples.[id]';
import type { SampleListResponse, SampleResponse } from '@/api/types';
import { MediaType, SampleState } from '@/api/types';
import { updateSampleState, updateSampleAnnotationResult } from '@/api/services/samples';
import { message } from '@/StaticAnt';

import AnnotationContext from '../../annotation.context';

interface AnnotationRightCornerProps {
  isLastSample: boolean;
  isFirstSample: boolean;
  // 用于标注预览
  noSave?: boolean;
}

export const SAMPLE_CHANGED = 'sampleChanged';

function getAnnotationCount(_result: string | object) {
  const resultParsed = typeof _result !== 'object' ? JSON.parse(_result as string) : _result;
  let result = 0;

  for (const key in resultParsed) {
    if (key.indexOf('Tool') > -1 && key !== 'textTool' && key !== 'tagTool') {
      const tool = resultParsed[key];

      if (!tool.result) {
        let temp = 0;

        if (tool.length) {
          temp = tool.length;
        }

        result = result + temp;
      } else {
        result = result + tool.result.length;
      }
    }
  }

  return result;
}

export interface AnnotationLoaderData {
  sample: SampleResponse;
  samples: SampleListResponse;
}

const AnnotationRightCorner = ({ isLastSample, isFirstSample, noSave }: AnnotationRightCornerProps) => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isGlobalLoading = isFetching > 0 || isMutating > 0;
  const navigate = useNavigate();
  const routeParams = useParams();
  const revalidator = useRevalidator();
  const taskId = routeParams.taskId;
  const sampleId = routeParams.sampleId;
  const { samples, setSamples, task } = useContext(AnnotationContext);
  const sampleIndex = _.findIndex(samples, (sample: SampleResponse) => sample.id === +sampleId!);
  const currentSample = samples[sampleIndex];
  const isSampleSkipped = currentSample?.state === SampleState.SKIPPED;
  const [searchParams] = useSearchParams();

  const navigateWithSearch = useCallback(
    (to: string) => {
      const searchStr = searchParams.toString();

      if (searchStr) {
        navigate(`${to}?${searchStr}`);
      } else {
        navigate(to);
      }
    },
    [navigate, searchParams],
  );

  const handleCancelSkipSample = async () => {
    if (noSave) {
      return;
    }

    await updateSampleState(
      {
        task_id: +taskId!,
        sample_id: +sampleId!,
      },
      {
        ...currentSample,
        state: SampleState.NEW,
      },
    );

    setSamples(
      samples.map((sample: SampleResponse) =>
        sample.id === +sampleId! ? { ...sample, state: SampleState.NEW } : sample,
      ),
    );
  };

  const handleSkipSample = async () => {
    if (noSave) {
      return;
    }

    await updateSampleState(
      {
        task_id: +taskId!,
        sample_id: +sampleId!,
      },
      {
        ...currentSample,
        state: SampleState.SKIPPED,
      },
    );

    setSamples(
      samples.map((sample: SampleResponse) =>
        sample.id === +sampleId! ? { ...sample, state: SampleState.SKIPPED } : sample,
      ),
    );
    // 切换到下一个文件
    if (!isLastSample) {
      navigateWithSearch(`/tasks/${taskId}/samples/${_.get(samples, `[${sampleIndex + 1}].id`)}`);
    } else {
      navigateWithSearch(`/tasks/${taskId}/samples/finished`);
    }
  };

  useHotkeys(
    'ctrl+space, meta+space',
    () => {
      if (noSave) {
        return;
      }

      if (currentSample.state === SampleState.SKIPPED) {
        handleCancelSkipSample();
      } else {
        handleSkipSample();
      }
    },
    {
      keyup: true,
      keydown: false,
    },
    [handleSkipSample, handleCancelSkipSample, currentSample],
  );

  const saveCurrentSample = useCallback(async () => {
    if (currentSample?.state === SampleState.SKIPPED || noSave || !task?.media_type) {
      return;
    }

    const result = {};
    let innerSample;

    if (task.media_type === MediaType.IMAGE) {
      // @ts-ignore
      const imageResult = (await imageAnnotationRef.current?.getAnnotations()) ?? {};
      const tagOrTextResult = (await imageAnnotationRef.current?.getGlobalAnnotations()) ?? {};
      const engine = await imageAnnotationRef.current?.getEngine();

      result.width = engine?.backgroundRenderer?.image?.width ?? 0;
      result.height = engine?.backgroundRenderer?.image?.height ?? 0;
      result.rotate = engine?.backgroundRenderer?.rotate ?? 0;

      innerSample = await imageAnnotationRef?.current?.getSample();

      Object.keys(imageResult).forEach((item) => {
        if (imageResult?.[item]?.length) {
          result[item + 'Tool'] = {
            toolName: item + 'Tool',
            result: imageResult[item].map((annotation: any) => {
              const resultItem = {
                ...omit(['tool', 'visible'])(annotation),
              };

              return resultItem;
            }),
          };
        }
      });

      Object.keys(tagOrTextResult).forEach((item) => {
        if (tagOrTextResult?.[item]?.length) {
          result[item + 'Tool'] = {
            toolName: item + 'Tool',
            result: tagOrTextResult[item],
          };
        }
      });
    } else if (task.media_type === MediaType.VIDEO) {
      const videoAnnotations = await videoAnnotationRef.current?.getAnnotations();

      Object.keys(videoAnnotations ?? {}).forEach((toolName) => {
        if (toolName === 'tag') {
          if (!result.tagTool) {
            result.tagTool = {
              toolName: 'tagTool',
              result: [],
            };
          }

          result.tagTool.result.push(...videoAnnotations[toolName]);
        }

        if (toolName === 'text') {
          if (!result.textTool) {
            result.textTool = {
              toolName: 'textTool',
              result: [],
            };
          }

          result.textTool.result.push(...videoAnnotations[toolName]);
        }

        if (toolName === 'frame') {
          if (!result.videoFrameTool) {
            result.videoFrameTool = {
              toolName: 'videoFrameTool',
              result: [],
            };
          }

          result.videoFrameTool.result.push(...videoAnnotations[toolName]);
        }

        if (toolName === 'segment') {
          if (!result.videoSegmentTool) {
            result.videoSegmentTool = {
              toolName: 'videoSegmentTool',
              result: [],
            };
          }

          result.videoSegmentTool.result.push(...videoAnnotations[toolName]);
        }
      });

      innerSample = await videoAnnotationRef?.current?.getSample();
    } else if (task.media_type === MediaType.AUDIO) {
      const audioAnnotations = await audioAnnotationRef.current?.getAnnotations();

      Object.keys(audioAnnotations ?? {}).forEach((toolName) => {
        if (toolName === 'tag') {
          if (!result.tagTool) {
            result.tagTool = {
              toolName: 'tagTool',
              result: [],
            };
          }

          result.tagTool.result.push(...audioAnnotations[toolName]);
        }

        if (toolName === 'text') {
          if (!result.textTool) {
            result.textTool = {
              toolName: 'textTool',
              result: [],
            };
          }

          result.textTool.result.push(...audioAnnotations[toolName]);
        }

        if (toolName === 'frame') {
          if (!result.audioFrameTool) {
            result.audioFrameTool = {
              toolName: 'audioFrameTool',
              result: [],
            };
          }

          result.audioFrameTool.result.push(...audioAnnotations[toolName]);
        }

        if (toolName === 'segment') {
          if (!result.audioSegmentTool) {
            result.audioSegmentTool = {
              toolName: 'audioSegmentTool',
              result: [],
            };
          }

          result.audioSegmentTool.result.push(...audioAnnotations[toolName]);
        }
      });

      innerSample = await audioAnnotationRef?.current?.getSample();
    }

    // 防止sampleid保存错乱，使用标注时传入的sampleid
    const body = set('data.result')(JSON.stringify(result))(currentSample);

    await updateSampleAnnotationResult(+taskId!, +innerSample.id!, {
      ...body,
      annotated_count: getAnnotationCount(body.data!.result),
      state: SampleState.DONE,
    });
  }, [currentSample, noSave, task?.media_type, taskId]);

  const handleComplete = useCallback(async () => {
    await saveCurrentSample();
    navigateWithSearch(`/tasks/${taskId}/samples/finished`);
    setTimeout(revalidator.revalidate);
  }, [saveCurrentSample, navigateWithSearch, taskId, revalidator.revalidate]);

  const handleNextSample = useCallback(() => {
    if (noSave) {
      navigateWithSearch(`/tasks/${taskId}/samples/${_.get(samples, `[${sampleIndex + 1}].id`)}`);

      return;
    }

    if (isLastSample) {
      handleComplete();
    } else {
      saveCurrentSample().then(() => {
        navigateWithSearch(`/tasks/${taskId}/samples/${_.get(samples, `[${sampleIndex + 1}].id`)}`);
      });
    }
  }, [noSave, isLastSample, navigateWithSearch, taskId, samples, sampleIndex, handleComplete, saveCurrentSample]);

  const handlePrevSample = useCallback(async () => {
    if (sampleIndex === 0) {
      return;
    }

    if (!noSave) {
      await saveCurrentSample();
    }

    navigateWithSearch(`/tasks/${taskId}/samples/${_.get(samples, `[${sampleIndex - 1}].id`)}`);
  }, [sampleIndex, noSave, navigateWithSearch, taskId, samples, saveCurrentSample]);

  const onKeyDown = debounce(
    useCallback(
      (e: KeyboardEvent) => {
        const key = e.key;
        if (key === 'a' && sampleIndex > 0) {
          handlePrevSample();
        } else if (key === 'd') {
          handleNextSample();
        }
      },
      [handleNextSample, handlePrevSample, sampleIndex],
    ),
    500,
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  useHotkeys(
    'ctrl+s,meta+s',
    () => {
      if (noSave) {
        return;
      }

      saveCurrentSample().then(() => {
        message.success('已保存');
      });
    },
    {
      preventDefault: true,
    },
    [saveCurrentSample, noSave],
  );

  // 从外部触发上下翻页，比如快捷键，不知道上下sample的id
  useEffect(() => {
    const handleSampleChanged = (e: CustomEvent) => {
      const changeType = _.get(e, 'detail');

      if (changeType === 'next') {
        handleNextSample();
      } else if (changeType === 'prev') {
        handlePrevSample();
      }
    };

    document.addEventListener(SAMPLE_CHANGED, handleSampleChanged as EventListener);

    return () => {
      document.removeEventListener(SAMPLE_CHANGED, handleSampleChanged as EventListener);
    };
  }, [handleNextSample, handlePrevSample]);

  // 监听标注主页的左侧文件切换
  useEffect(() => {
    const saveCurrentSampleFromOutside = (e: CustomEvent) => {
      const _sampleId = _.get(e, 'detail.sampleId');

      if (noSave) {
        navigateWithSearch(`/tasks/${taskId}/samples/${_sampleId}`);

        return;
      }

      saveCurrentSample().then(() => {
        if (_.isNil(_sampleId)) {
          return;
        }

        navigateWithSearch(`/tasks/${taskId}/samples/${_sampleId}`);
      });
    };

    document.addEventListener(SAMPLE_CHANGED, saveCurrentSampleFromOutside as EventListener);

    return () => {
      document.removeEventListener(SAMPLE_CHANGED, saveCurrentSampleFromOutside as EventListener);
    };
  }, [navigateWithSearch, noSave, saveCurrentSample, taskId]);

  if (noSave) {
    return null;
  }

  return (
    <FlexLayout items="center" gap=".5rem">
      {isSampleSkipped ? (
        <Button type="text" onClick={commonController.debounce(handleCancelSkipSample, 100)} disabled={isGlobalLoading}>
          取消跳过
        </Button>
      ) : (
        <Button type="text" onClick={commonController.debounce(handleSkipSample, 100)} disabled={isGlobalLoading}>
          跳过
        </Button>
      )}
      {!isFirstSample && (
        <Button onClick={commonController.debounce(handlePrevSample, 100)} disabled={isGlobalLoading}>
          上一页
        </Button>
      )}
      {isLastSample ? (
        <Button type="primary" onClick={commonController.debounce(handleComplete, 100)} disabled={isGlobalLoading}>
          完成
        </Button>
      ) : (
        <Button type="primary" onClick={commonController.debounce(handleNextSample, 100)} disabled={isGlobalLoading}>
          下一页
        </Button>
      )}
    </FlexLayout>
  );
};
export default AnnotationRightCorner;
