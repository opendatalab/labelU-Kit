import { useEffect, useCallback, useContext } from 'react';
import { useNavigate, useParams, useRouteLoaderData } from 'react-router';
import { Button } from 'antd';
import _ from 'lodash-es';

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
  const currentSample = (useRouteLoaderData('annotation') as AnnotationLoaderData).sample;
  const { samples } = useContext(AnnotationContext);
  const isSampleSkipped = currentSample?.state === SampleState.SKIPPED;
  const sampleIndex = _.findIndex(samples, (sample: SampleResponse) => sample.id === +sampleId!);

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
  };
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
  };

  const handleSampleChange = useCallback(
    async (nextSampleId: number | undefined) => {
      if (currentSample?.state === SampleState.SKIPPED) {
        return;
      }

      // @ts-ignore
      const cResult = await annotationRef?.current?.getResult();
      const rResult = cResult[0].result;
      const body = {
        ...currentSample,
        result: rResult,
      };

      await updateSampleAnnotationResult(+taskId!, +sampleId!, {
        ...body,
        annotated_count: getAnnotationCount(JSON.parse(body.result)),
        state: SampleState.DONE,
      });

      const newSampleId = typeof nextSampleId !== 'number' ? _.get(samples, `[${sampleIndex + 1}].id`) : nextSampleId;

      // 切换到下一个样本
      navigate(`/tasks/${taskId}/samples/${newSampleId}`);
    },
    [currentSample, navigate, sampleId, sampleIndex, samples, taskId],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keyCode = e.keyCode;
      if (keyCode === 65 && sampleIndex > 0) {
        commonController.debounce(() => handleSampleChange(_.get(samples, `[${sampleIndex - 1}].id`)), 1000)('');
      } else if (keyCode === 68) {
        handleSampleChange(undefined);
      }
    },
    [handleSampleChange, sampleIndex, samples],
  );

  useEffect(() => {
    document.addEventListener('keyup', onKeyDown);

    return () => {
      document.removeEventListener('keyup', onKeyDown);
    };
  }, [onKeyDown]);

  // 监听标注主页的左侧样本切换
  useEffect(() => {
    const handleSampleChangeFromOutside = ({ detail: { sampleId: _sampleId } }: CustomEvent) => {
      handleSampleChange(_sampleId);
    };

    document.addEventListener(SAMPLE_CHANGED, handleSampleChangeFromOutside as EventListener);

    return () => {
      document.removeEventListener(SAMPLE_CHANGED, handleSampleChangeFromOutside as EventListener);
    };
  }, [handleSampleChange]);

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
        <Button type="primary" id={'nextPage'} onClick={commonController.debounce(handleSampleChange, 100)}>
          {isLastSample ? '完成' : '下一页'}
        </Button>
      </div>
    </div>
  );
};
export default AnnotationRightCorner;
