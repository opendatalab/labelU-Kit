import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Provider } from 'react-redux';

import type { SampleState } from '@/enums';

import SliderCard from './components/sliderCard';
import { getSamples } from '../../services/samples';
import commonController from '../../utils/common/common';
import currentStyles from './index.module.scss';
import store from '../../stores';

const SlideLoader = () => {
  const [prevImgList, setPrevImgList] = useState<any[]>([]);
  const routeParams = useParams();
  const taskId = +routeParams.taskId!;
  const sampleId = +routeParams.sampleId!;
  const [upNoneTipShow, setUpNoneTipShow] = useState(false);
  const [downNoneTipShow, setDownNoneTipShow] = useState(false);
  const [requestUpDoor, setRequestUpDoor] = useState(true);
  const [requestDownDoor, setRequestDownDoor] = useState(true);
  const requestPreview = async function (params: any, currentImg?: any) {
    await getSamples(taskId, params)
      .then(({ data }) => {
        const newPrevImgList: any[] = [];
        for (const prevImg of data) {
          const transformedPrevImg: any = commonController.transformFileList(prevImg.data, prevImg.id);
          //delete
          transformedPrevImg[0].state = prevImg.state;
          newPrevImgList.push(transformedPrevImg[0]);
        }
        let temp: any = Object.assign([], prevImgList);
        if (currentImg) {
          temp = [currentImg];
        }

        if (newPrevImgList.length === 0) {
          if (params.after || params.after === 0) {
            setDownNoneTipShow(true);
            setRequestDownDoor(false);
          } else {
            setUpNoneTipShow(true);
            setRequestUpDoor(false);
          }
          if (currentImg) {
            setPrevImgList(temp);
          }
        } else {
          if (params.after || params.after === 0) {
            setPrevImgList(temp.concat([], newPrevImgList));
          } else {
            setPrevImgList(newPrevImgList.concat(temp));
          }
          return newPrevImgList[0].id;
        }
      })
      .catch((error) => {
        if (currentImg) {
          setPrevImgList(currentImg);
        }
        commonController.notificationErrorMessage(error, 1);
      });
  };
  const lazyLoading = (e: any) => {
    const scrollHeight = e.target.scrollHeight;
    const scrollTop = e.target.scrollTop;
    const clientHeight = e.target.clientHeight;
    const diff = scrollHeight - scrollTop;
    const newDiff = Math.abs(diff - clientHeight);
    if (newDiff <= 1 && requestDownDoor) {
      requestPreview({
        after: prevImgList[prevImgList.length - 1].id,
        pageSize: 10,
      });
    }

    if (scrollTop === 0 && requestUpDoor) {
      requestPreview({
        before: prevImgList[0].id,
        pageSize: 10,
      });
    }
  };
  const get10Samples = async function (direction: string) {
    try {
      const samplesRes = await getSamples(taskId, {
        [direction]: sampleId,
        pageSize: 10,
      });
      const newPrevImgList: any[] = [];
      for (const prevImg of samplesRes.data) {
        const transformedPrevImg: any = commonController.transformFileList(prevImg.data, prevImg.id);
        //delete
        transformedPrevImg[0].state = prevImg.state;
        newPrevImgList.push(transformedPrevImg[0]);
      }

      if (newPrevImgList.length === 0) {
        if (direction === 'after') {
          setDownNoneTipShow(true);
          setRequestDownDoor(false);
        } else {
          setUpNoneTipShow(true);
          setRequestUpDoor(false);
        }
      }
      return newPrevImgList;
    } catch (error) {
      return [];
    }
  };

  const getSampleLocal = async function () {
    const sample = store.getState()?.samples.currentSample;
    if (sample) {
      const newSample: any = commonController.transformFileList(sample.data, sample.id);
      newSample[0].state = sample.state;
      const after10 = await get10Samples('after');
      const before10 = await get10Samples('before');
      setPrevImgList(Object.assign(before10.concat(newSample, after10)));
    } else {
      commonController.notificationErrorMessage({ message: '请求任务出错' }, 1);
    }
  };

  const navigate = useNavigate();
  const getAfterSampleId = async function (params: any) {
    const samplesRes = await getSamples(taskId, params);
    const newPrevImgList: any[] = [];

    for (const prevImg of samplesRes.data) {
      const transformedPrevImg: any = commonController.transformFileList(prevImg.data, prevImg.id);
      transformedPrevImg[0].state = prevImg.state;
      newPrevImgList.push(transformedPrevImg[0]);
    }

    if (newPrevImgList.length === 0) {
      return undefined;
    } else {
      return newPrevImgList;
    }
  };
  const getBeforeSampleId = async function (params: any) {
    const samplesRes = await getSamples(taskId, params);
    const newPrevImgList: any[] = [];

    for (const prevImg of samplesRes.data) {
      const transformedPrevImg: any = commonController.transformFileList(prevImg.data, prevImg.id);
      transformedPrevImg[transformedPrevImg.length - 1].state = prevImg.state;
      newPrevImgList.push(transformedPrevImg[transformedPrevImg.length - 1]);
    }

    if (newPrevImgList.length === 0) {
      return undefined;
    } else {
      return newPrevImgList;
    }
  };
  const updatePrevImageListState = async function (state: string) {
    const temp: any = Object.assign([], prevImgList);
    let nextPageId: any = null;
    for (let prevImgIndex = 0; prevImgIndex < temp.length; prevImgIndex++) {
      const prevImg: any = temp[prevImgIndex];
      if (prevImg.id === sampleId) {
        prevImg.state = state;
        if (temp[prevImgIndex + 1]) {
          // @ts-ignore
          nextPageId = temp[prevImgIndex + 1].id;
        } else {
          nextPageId = await getAfterSampleId({
            after: prevImgList[prevImgList.length - 1].id,
            pageSize: 10,
          });
        }
        break;
      }
    }
    if (nextPageId || nextPageId === 0) {
      let nextSampleId = nextPageId;

      if (typeof nextPageId !== 'number') {
        nextSampleId = nextPageId[0].id;
        setPrevImgList(temp.concat(nextPageId));
      }

      navigate(`/tasks/${taskId}/samples/${nextSampleId}`);
    } else {
      setPrevImgList(temp);
      navigate(`/tasks/${taskId}/samples/finished?sampleId=${temp[temp.length - 1]?.id}`);
    }
  };

  const updatePrevImageListStatePrev = async function (state: string) {
    const temp: any = Object.assign([], prevImgList);
    let prevPageId: any = null;
    for (let prevImgIndex = 0; prevImgIndex < temp.length; prevImgIndex++) {
      const prevImg: any = temp[prevImgIndex];
      if (prevImg.id === sampleId) {
        prevImg.state = state;
        if (temp[prevImgIndex - 1]) {
          // @ts-ignore
          prevPageId = temp[prevImgIndex - 1].id;
        } else {
          prevPageId = await getBeforeSampleId({
            before: prevImgList[0].id,
            pageSize: 10,
          });
        }
        break;
      }
    }
    if (prevPageId || prevPageId === 0) {
      let nextSampleId = prevPageId;

      if (typeof prevPageId !== 'number') {
        nextSampleId = prevPageId[0].id;
        setPrevImgList(temp.concat(prevPageId));
      }

      navigate(`/tasks/${taskId}/samples/${nextSampleId}`);
    } else {
      setPrevImgList(temp);
    }
  };

  const updatePrevImageListStatePointer = async function (state: string) {
    const temp: any = Object.assign([], prevImgList);
    for (let prevImgIndex = 0; prevImgIndex < temp.length; prevImgIndex++) {
      const prevImg: any = temp[prevImgIndex];
      if (prevImg.id === sampleId) {
        if (prevImg.state !== 'SKIPPED') {
          prevImg.state = state;
          break;
        }
      }
    }
    setPrevImgList(temp);
    const ids = window.location.search.split('&').pop();
    // @ts-ignore
    const id = parseInt(ids?.split('=').pop());
    const location = window.location.pathname.split('/');
    location.pop();
    // @ts-ignore
    location.push(id);
    const newPathname = location.join('/');
    navigate(newPathname);
  };

  const updatePrevImageListStateForSkippedAndNew = async function (state: string) {
    const temp: any = Object.assign([], prevImgList);

    for (let prevImgIndex = 0; prevImgIndex < temp.length; prevImgIndex++) {
      const prevImg: any = temp[prevImgIndex];
      if (prevImg.id === sampleId) {
        prevImg.state = state;
        break;
      }
    }
    setPrevImgList(temp);
  };

  useEffect(() => {
    getSampleLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const search = window.location.search;
    if (search.indexOf('DONE') > -1) {
      updatePrevImageListState('DONE');
    }
    if (search.indexOf('JUMPDOWN') > -1) {
      updatePrevImageListState('SKIPPED');
      // updatePrevImageListState('DONE');
    }
    if (search.indexOf('SKIPPED') > -1) {
      updatePrevImageListStateForSkippedAndNew('SKIPPED');
    }
    if (search.indexOf('NEW') > -1) {
      updatePrevImageListStateForSkippedAndNew('NEW');
    }

    if (search.indexOf('PREV') > -1) {
      updatePrevImageListStatePrev('DONE');
    }
    if (search.indexOf('JUMPUP') > -1) {
      updatePrevImageListStatePrev('SKIPPED');
    }
    if (search.indexOf('POINTER') > -1) {
      updatePrevImageListStatePointer('DONE');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.search]);

  const updateSampleState = async (state: SampleState) => {};

  /**
   * 切换样本时
   * 1. 下一张或者上一张时，需要将当前的标注结果更新到当前样本后，再进行切换
   *    1.1 如果当前样本是「跳过」的状态，那么不需要更新标注结果
   *    1.2 如果当前样本是「完成」的状态，那么需要更新标注结果，并且将当前样本的状态改为「完成」
   * 2. 将当前样本标记为「跳过」，更新样本状态为「跳过」，然后跳到下一张
   * 3. 将当前样本标记为「取消跳过」，更新样本状态为「新」
   */

  return (
    <Provider store={store}>
      <div className={currentStyles.leftBar} onScroll={lazyLoading}>
        {upNoneTipShow && <div className={currentStyles.tips}>已到第一张</div>}
        {prevImgList.map((item: any, itemIndex: number) => {
          return <SliderCard cardInfo={item} key={itemIndex} />;
        })}
        {downNoneTipShow && <div className={currentStyles.tips}>已到最后一张</div>}
      </div>
    </Provider>
  );
};

export default SlideLoader;
