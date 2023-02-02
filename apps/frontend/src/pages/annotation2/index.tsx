import React, { useState, useEffect, memo, createRef } from 'react';

// import Annotation from '../annotation/index';
import classnames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router';

import Annotation from '../../components/business/annotation';
import currentStyles from './index.module.scss';
import { getTask, getSample, getPreSample } from '../../services/samples';
import commonController from '../../utils/common/common';
import SlideLoader from '../../components/slideLoader';
import { updateCurrentSampleId } from '../../stores/sample.store';
// import otherStore from "../../stores/other";
import AnnotationRightCorner from '../../components/annotationRightCorner';
import { updateAnnotationDatas } from '../../stores/annotation.store';

// import TF from './tF';
export const annotationRef = createRef();

// @ts-ignore
const AnnotationPage = () => {
  const location = useLocation();
  // @ts-ignore
  const MemoSlideLoader = memo(SlideLoader);
  const taskId = parseInt(window.location.pathname.split('/')[2]);
  const sampleId = parseInt(window.location.pathname.split('/')[4]);
  // @ts-ignore
  // otherStore.currentSampleId = sampleId;
  // let annotationRef = useSelector(state => state.annotation.annotationDatas)
  const dispatch = useDispatch();
  const [taskConfig, setTaskConfig] = useState<any>({});
  const [taskSample, setTaskSample] = useState<any>([]);
  const getDatas = async function (taskId: number, sampleId: number) {
    try {
      const taskRes = await getTask(taskId);
      // @ts-ignore
      if (taskRes.status === 200) {
        // taskRes.data.data.config = {
        //     "tools": [
        //         {
        //             "tool": "rectTool",
        //             "config": {
        //                 "isShowCursor": false,
        //                 "showConfirm": false,
        //                 "skipWhileNoDependencies": false,
        //                 "drawOutsideTarget": false,
        //                 "copyBackwardResult": true,
        //                 "minWidth": 1,
        //                 "attributeConfigurable": true,
        //                 "textConfigurable": true,
        //                 "textCheckType": 4,
        //                 "customFormat": "",
        //                 "attributeList": [
        //                     {
        //                         "key": "rectTool",
        //                         "value": "rectTool"
        //                     }
        //                 ]
        //             }
        //         }
        //     ],
        //     "tagList": [],
        //     "attribute": [
        //         {
        //             "key": "RT",
        //             "value": "RT"
        //         }
        //     ],
        //     "textConfig": [],
        // }
        // @ts-ignore
        setTaskConfig(JSON.parse(taskRes?.data.data.config));
        // setTaskConfig(JSON.parse(taskRes.data.data.config));
      } else {
        commonController.notificationErrorMessage({ message: '请求任务出错' }, 1);
        return;
      }
      const sampleRes = await getSample(taskId, sampleId);
      if (sampleRes.status === 200) {
        const newSample = commonController.transformFileList(sampleRes.data.data.data, sampleRes.data.data.id);
        setTaskSample(newSample);
      } else {
        commonController.notificationErrorMessage({ message: '请求任务出错' }, 1);
      }
    } catch (err) {
      commonController.notificationErrorMessage(err, 1);
    }
  };

  useEffect(() => {
    const taskId = parseInt(window.location.pathname.split('/')[2]);
    const sampleId = parseInt(window.location.pathname.split('/')[4]);
    // if(taskSample && taskSample.length > 0 && sampleId === taskSample[0].id) {
    //
    //   return;
    // }
    // if (taskSample.length === 0) return;
    getDatas(taskId, sampleId)
      .then(() => console.log('ok'))
      .catch((err) => console.log(err));
    dispatch(updateCurrentSampleId(sampleId));
  }, [location]);

  // const [taskSampleC, setTaskSampleC] = useState(0);

  // useEffect(()=>{
  //   setTaskSampleC(taskSampleC + 1)
  //   // console.trace();
  // },[ taskSample ]);

  // useEffect(()=>{
  //     getDatas(taskId, sampleId).then(()=>console.log('ok')).catch(err=>console.log(err));
  //     dispatch(updateCurrentSampleId(sampleId));
  //     // dispatch(updateAnnotationDatas(annotationRefNew))
  // },[]);
  const goBack = (data: any) => {};
  // @ts-ignore
  // const leftSiderContent = <MemoSlideLoader />;
  const leftSiderContent = <SlideLoader />;
  // const leftSiderContent = <div>test</div>;

  // const leftSiderContent = (<div>test1</div>)
  const topActionContent = <AnnotationRightCorner />;
  // const topActionContent = (<div>2</div>)
  const exportData = (data: any) => {};
  const onSubmit = (data: any) => {
    dispatch(updateAnnotationDatas(data[0].result));
  };

  const testGet = () => {};

  const updatePrevImageListResult = async function () {
    // let temp : any= Object.assign([],prevImgList);
    const taskId = parseInt(window.location.pathname.split('/')[2]);
    const sampleId = parseInt(window.location.pathname.split('/')[4]);

    // getSamples(taskId, {
    //     before : sampleId,
    //     pageSize : 1
    // }).then((res:any)=>{
    //   if (res.status === 200){
    //       if(res.data.data.length === 0){
    //           commonController.notificationWarnMessage({message : '没有上一张'},1);
    //       }else{
    //           let result = res.data.data[0].data.result;
    //           let newTaskSample = [{...taskSample[0],result}]
    //           setTaskSample(newTaskSample);
    //       }
    //   }else{
    //     commonController.notificationErrorMessage({message : '请求数据错误'},1);
    //   }
    // }).catch(error=>commonController.notificationErrorMessage(error,1))

    getPreSample(taskId, sampleId)
      .then((res: any) => {
        if (res.status === 200) {
          const result = res.data.data.data.result;
          const newTaskSample = [{ ...taskSample[0], result }];
          setTaskSample(newTaskSample);
        } else {
          commonController.notificationErrorMessage({ message: '请求数据错误' }, 1);
        }
      })
      .catch((error) => commonController.notificationErrorMessage(error, 1));
  };
  useEffect(() => {
    const search = window.location.search;
    if (search.indexOf('COPYPRE') > -1) {
      updatePrevImageListResult();
    }
  }, [window.location.search]);

  return (
    <div className={currentStyles.annotationPage}>
      {/*{ t[0].result }*/}
      {/*  <TF t1 = {t} />*/}
      {/*  <div>{taskSampleC}</div>*/}
      {taskSample && taskSample.length > 0 && taskConfig.tools && taskConfig.tools.length > 0 && (
        <Annotation
          leftSiderContent={leftSiderContent}
          topActionContent={topActionContent}
          annotationRef={annotationRef}
          attribute={taskConfig.attribute}
          tagList={taskConfig.tagList}
          fileList={[{ ...taskSample[0] }]}
          textConfig={taskConfig.textConfig}
          goBack={goBack}
          tools={taskConfig.tools}
          // exportData = {exportData}
          // onSubmit = {onSubmit}
          commonAttributeConfigurable={taskConfig.commonAttributeConfigurable}
        />
      )}
    </div>
  );
};
export default AnnotationPage;
