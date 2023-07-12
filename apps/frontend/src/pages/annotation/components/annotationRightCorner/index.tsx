import { useEffect, useCallback, useContext } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from 'antd';
import _, { debounce } from 'lodash-es';
import { set } from 'lodash/fp';
import { useSelector } from 'react-redux';

import commonController from '@/utils/common/common';
import { annotationRef } from '@/pages/annotation';
import type { SampleListResponse, SampleResponse } from '@/services/types';
import { SampleState } from '@/services/types';
import { updateSampleState, updateSampleAnnotationResult } from '@/services/samples';
import type { RootState } from '@/store';

import currentStyles from './index.module.scss';
import AnnotationContext from '../../annotation.context';

interface AnnotationRightCornerProps {
  isLastSample: boolean;
  isFirstSample: boolean;
}

export const SAMPLE_CHANGED = 'sampleChanged';

function getAnnotationCount(resultParsed: any) {
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

const AnnotationRightCorner = ({ isLastSample, isFirstSample }: AnnotationRightCornerProps) => {
  const isGlobalLoading = useSelector((state: RootState) => state.loading.global);
  const navigate = useNavigate();
  const routeParams = useParams();
  const taskId = routeParams.taskId;
  const sampleId = routeParams.sampleId;
  const { samples, setSamples } = useContext(AnnotationContext);
  const sampleIndex = _.findIndex(samples, (sample: SampleResponse) => sample.id === +sampleId!);
  const currentSample = samples[sampleIndex];
  const isSampleSkipped = currentSample?.state === SampleState.SKIPPED;

  const handleCancelSkipSample = async () => {
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
      navigate(`/tasks/${taskId}/samples/${_.get(samples, `[${sampleIndex + 1}].id`)}`);
    } else {
      navigate(`/tasks/${taskId}/samples/finished`);
    }
  };

  const saveCurrentSample = useCallback(async () => {
    if (currentSample?.state === SampleState.SKIPPED) {
      return;
    }

    // @ts-ignore
    const result = await annotationRef?.current?.getResult();
    // 防止sampleid保存错乱，使用标注时传入的sampleid
    const innerSample = await annotationRef?.current?.getSample();
    const body = set('data.result')(JSON.stringify(result))(currentSample);

    await updateSampleAnnotationResult(+taskId!, +innerSample.id!, {
      ...body,
      annotated_count: getAnnotationCount(body.data!.result),
      state: SampleState.DONE,
    });
  }, [currentSample, taskId]);

  const handleComplete = useCallback(async () => {
    await saveCurrentSample();
    navigate(`/tasks/${taskId}/samples/finished`);
  }, [saveCurrentSample, navigate, taskId]);

  const handleNextSample = useCallback(async () => {
    if (isLastSample) {
      handleComplete();
    } else {
      await saveCurrentSample();
      navigate(`/tasks/${taskId}/samples/${_.get(samples, `[${sampleIndex + 1}].id`)}`);
    }
  }, [handleComplete, saveCurrentSample, isLastSample, navigate, sampleIndex, samples, taskId]);

  const handlePrevSample = useCallback(async () => {
    if (sampleIndex === 0) {
      return;
    }

    await saveCurrentSample();
    navigate(`/tasks/${taskId}/samples/${_.get(samples, `[${sampleIndex - 1}].id`)}`);
  }, [saveCurrentSample, navigate, sampleIndex, samples, taskId]);

  const onKeyDown = debounce(
    useCallback(
      (e: KeyboardEvent) => {
        const keyCode = e.keyCode;
        if (keyCode === 65 && sampleIndex > 0) {
          handlePrevSample();
        } else if (keyCode === 68) {
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

      saveCurrentSample().then(() => {
        if (_.isNil(_sampleId)) {
          return;
        }

        navigate(`/tasks/${taskId}/samples/${_sampleId}`);
      });
    };

    document.addEventListener(SAMPLE_CHANGED, saveCurrentSampleFromOutside as EventListener);

    return () => {
      document.removeEventListener(SAMPLE_CHANGED, saveCurrentSampleFromOutside as EventListener);
    };
  }, [navigate, saveCurrentSample, taskId]);

  return (
    <div className={currentStyles.outerFrame} id="rightCorner">
      <div className={currentStyles.right}>
        {isSampleSkipped ? (
          <Button
            type="text"
            onClick={commonController.debounce(handleCancelSkipSample, 100)}
            disabled={isGlobalLoading}
          >
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
      </div>
    </div>
  );
};
export default AnnotationRightCorner;
