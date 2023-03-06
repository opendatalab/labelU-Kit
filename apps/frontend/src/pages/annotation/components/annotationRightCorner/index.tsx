import { useEffect, useCallback, useContext } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from 'antd';
import _ from 'lodash-es';
import { set } from 'lodash/fp';

import commonController from '@/utils/common/common';
import { annotationRef } from '@/pages/annotation';
import type { SampleListResponse, SampleResponse } from '@/services/types';
import { SampleState } from '@/services/types';
import { updateSampleState, updateSampleAnnotationResult } from '@/services/samples';

import currentStyles from './index.module.scss';
import AnnotationContext from '../../annotation.context';

interface AnnotationRightCornerProps {
  isLastSample: boolean;
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

const AnnotationRightCorner = ({ isLastSample }: AnnotationRightCornerProps) => {
  const navigate = useNavigate();
  const routeParams = useParams();
  const taskId = routeParams.taskId;
  const sampleId = routeParams.sampleId;
  // TODO： 此处使用 useSelector 会获取到labelu/components中的store，后期需要修改
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
    // 切换到下一个样本
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
    const cResult = await annotationRef?.current?.getResult();
    const rResult = cResult[0].result;
    const body = set('data.result')(rResult)(currentSample);

    await updateSampleAnnotationResult(+taskId!, +sampleId!, {
      ...body,
      annotated_count: getAnnotationCount(JSON.parse(body.data!.result)),
      state: SampleState.DONE,
    });
  }, [currentSample, sampleId, taskId]);

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

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keyCode = e.keyCode;
      if (keyCode === 65 && sampleIndex > 0) {
        commonController.debounce(handlePrevSample, 1000)('');
      } else if (keyCode === 68) {
        handleNextSample();
      }
    },
    [handleNextSample, handlePrevSample, sampleIndex],
  );

  useEffect(() => {
    document.addEventListener('keyup', onKeyDown);

    return () => {
      document.removeEventListener('keyup', onKeyDown);
    };
  }, [onKeyDown]);

  // 监听标注主页的左侧样本切换
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
          <Button id={'skipped'} onClick={commonController.debounce(handleCancelSkipSample, 100)}>
            取消跳过
          </Button>
        ) : (
          <Button id={'skipped'} onClick={commonController.debounce(handleSkipSample, 100)}>
            跳过
          </Button>
        )}
        {isLastSample ? (
          <Button type="primary" onClick={commonController.debounce(handleComplete, 100)}>
            完成
          </Button>
        ) : (
          <Button type="primary" onClick={commonController.debounce(handleNextSample, 100)}>
            下一页
          </Button>
        )}
      </div>
    </div>
  );
};
export default AnnotationRightCorner;
