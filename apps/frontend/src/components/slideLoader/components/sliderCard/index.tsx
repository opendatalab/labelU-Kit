import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, connect } from 'react-redux';
import { useNavigate } from 'react-router';

import currentStyles from './index.module.scss';
import commonController from '../../../../utils/common/common';
import { getSample, updateSampleAnnotationResult } from '../../../../services/samples';
import { updateCurrentSampleId } from '../../../../stores/sample.store';
import otherStore from '../../../../stores/other';
import { annotationRef } from '../../../../pages/annotation2';

const SliderCard = (props: any) => {
  const { id, state, url } = props.cardInfo;
  const [currentSampleId, setCurrentSampleId] = useState(parseInt(window.location.pathname.split('/')[4]));
  const navigate = useNavigate();
  const clickSample = async function () {
    const taskId = parseInt(window.location.pathname.split('/')[2]);
    const sampleId = parseInt(window.location.pathname.split('/')[4]);
    // @ts-ignore
    const cResult = await annotationRef?.current?.getResult();
    const rResult = cResult[0].result;

    getSample(taskId, sampleId)
      .then((res) => {
        if (res.status === 200) {
          const sampleResData = res.data.data.data;
          let annotated_count = 0;
          // @ts-ignore
          // let  dataParam = Object.assign({},sampleResData,{ result :  annotationRef?.current?.getResult()[0].result});
          const dataParam = Object.assign({}, sampleResData, { result: rResult });
          if (res.data.data.state !== 'SKIPPED') {
            const resultJson = JSON.parse(dataParam.result);
            for (const key in resultJson) {
              if (key.indexOf('Tool') > -1 && key !== 'textTool' && key !== 'tagTool') {
                const tool = resultJson[key];
                if (!tool.result) {
                  let temp = 0;
                  if (tool.length) {
                    temp = tool.length;
                  }
                  annotated_count = annotated_count + temp;
                } else {
                  annotated_count = annotated_count + tool.result.length;
                }
              }
            }
            console.log(annotated_count);
            // @ts-ignore
            updateSampleAnnotationResult(taskId, sampleId, { annotated_count, state: 'DONE', data: dataParam })
              .then((res) => {
                if (res.status === 200) {
                  // Ob.nextPageS.next('DONE');

                  // let location = window.location.pathname.split('/');
                  // location.pop();
                  // location.push(id)
                  // let newPathname = location.join('/');
                  // navigate(newPathname);

                  navigate(window.location.pathname + '?' + 'POINTER' + new Date().getTime() + '&id=' + id);
                } else {
                  commonController.notificationErrorMessage({ message: '请求保存失败' }, 1);
                }
              })
              .catch((error) => {
                commonController.notificationErrorMessage(error, 1);
              });
          } else {
            navigate(window.location.pathname + '?' + 'POINTER' + new Date().getTime() + '&id=' + id);
          }
        } else {
          commonController.notificationErrorMessage({ message: '获取数据信息有误' }, 1);
        }
      })
      .catch((error) => {
        commonController.notificationErrorMessage(error, 1);
      });
  };
  useEffect(() => {
    setCurrentSampleId(parseInt(window.location.pathname.split('/')[4]));
  }, [window.location.pathname]);
  return (
    <React.Fragment>
      {id === currentSampleId && (
        <div className={currentStyles.outerFrame}>
          <div className={currentStyles.contentActive} onClick={clickSample}>
            <img src={url} alt="" style={{ height: '100%', maxWidth: '100%' }} />
            {state === 'DONE' && (
              <React.Fragment>
                <div className={currentStyles.tagBottom} />
                <div className={currentStyles.tagTop}>
                  <img src="/src/icons/check.png" alt="" />
                </div>
              </React.Fragment>
            )}
            {state === 'SKIPPED' && <div className={currentStyles.skipped}>跳过</div>}
          </div>
          <div className={currentStyles.idHighlight}>{id}</div>
        </div>
      )}
      {id !== currentSampleId && (
        <div className={currentStyles.outerFrame}>
          <div className={currentStyles.content} onClick={clickSample}>
            <img src={url} alt="" style={{ height: '100%', maxWidth: '100%' }} />
            {state === 'DONE' && (
              <React.Fragment>
                <div className={currentStyles.tagBottom} />
                <div className={currentStyles.tagTop}>
                  <img src="/src/icons/check.png" alt="" />
                </div>
              </React.Fragment>
            )}
            {state === 'SKIPPED' && <div className={currentStyles.skipped}>跳过</div>}
          </div>
          <div>{id}</div>
        </div>
      )}
    </React.Fragment>
  );
};
export default SliderCard;
