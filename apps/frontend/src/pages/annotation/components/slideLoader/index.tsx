import { useState, useEffect } from 'react';
import { useNavigate, useParams, useRouteLoaderData } from 'react-router';
import { Provider } from 'react-redux';

import type { SampleState } from '@/enums';
import type { SampleResponse } from '@/services/types';

import SliderCard from '../sliderCard';
import { getSamples } from '../../../../services/samples';
import commonController from '../../../../utils/common/common';
import currentStyles from './index.module.scss';
import type { AnnotationLoaderData } from '../annotationRightCorner';
import { SAMPLE_CHANGED } from '../annotationRightCorner';

const SlideLoader = () => {
  const routeParams = useParams();
  const taskId = +routeParams.taskId!;
  const sampleId = +routeParams.sampleId!;
  const currentSample = (useRouteLoaderData('annotation') as AnnotationLoaderData).sample;
  const samples = (useRouteLoaderData('annotation') as AnnotationLoaderData).samples.data;

  const handleSampleClick = (sample: SampleResponse) => {
    document.dispatchEvent(
      new CustomEvent(SAMPLE_CHANGED, {
        detail: {
          sampleId: sample.id,
        },
      }),
    );
  };

  /**
   * 切换样本时
   * 1. 下一张或者上一张时，需要将当前的标注结果更新到当前样本后，再进行切换
   *    1.1 如果当前样本是「跳过」的状态，那么不需要更新标注结果
   *    1.2 如果当前样本是「完成」的状态，那么需要更新标注结果，并且将当前样本的状态改为「完成」
   * 2. 将当前样本标记为「跳过」，更新样本状态为「跳过」，然后跳到下一张
   * 3. 将当前样本标记为「取消跳过」，更新样本状态为「新」
   */

  return (
    <div className={currentStyles.leftBar}>
      <div className={currentStyles.tips}>已到第一张</div>
      {samples.map((item: any, itemIndex: number) => {
        return <SliderCard cardInfo={item} key={itemIndex} onClick={handleSampleClick} />;
      })}
      <div className={currentStyles.tips}>已到最后一张</div>
    </div>
  );
};

export default SlideLoader;
