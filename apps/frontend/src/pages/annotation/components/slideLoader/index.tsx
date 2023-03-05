import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useParams } from 'react-router';

import type { SampleResponse } from '@/services/types';
import { useScrollFetch } from '@/hooks/useScrollFetch';

import SliderCard from '../sliderCard';
import { getSamples } from '../../../../services/samples';
import currentStyles from './index.module.scss';
import { SAMPLE_CHANGED } from '../annotationRightCorner';
import AnnotationContext from '../../annotation.context';

const SlideLoader = () => {
  const routeParams = useParams();
  const { setSamples } = useContext(AnnotationContext);
  const leftContainerRef = useRef<HTMLDivElement>(null);

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
      pageSize: 10,
    });

    currentPage.current += 1;
    setTotalCount(meta_data?.total ?? 0);

    return data;
  }, [routeParams.taskId]);
  const [samples = [] as SampleResponse[]] = useScrollFetch(fetchSamples, leftContainerRef.current!, {
    isEnd: () => totalCount === samples.length,
  });

  useEffect(() => {
    setSamples(samples || []);
  }, [samples, setSamples]);

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
    <div className={currentStyles.leftBar} ref={leftContainerRef}>
      <div className={currentStyles.tips}>已到第一张</div>
      {samples?.map((item: any, itemIndex: number) => {
        return <SliderCard cardInfo={item} key={itemIndex} onClick={handleSampleClick} />;
      })}
      {totalCount === samples?.length && <div className={currentStyles.tips}>已到最后一张</div>}
    </div>
  );
};

export default SlideLoader;
