import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import _ from 'lodash-es';

import currentStyles from './index.module.scss';
import commonController from '../../../../utils/common/common';
import { getSample, updateSampleAnnotationResult } from '../../../../services/samples';
import { annotationRef } from '../..';

const SliderCard = (props: any) => {
  const { id, state, url } = props.cardInfo;
  const [currentSampleId, setCurrentSampleId] = useState(parseInt(window.location.pathname.split('/')[4]));
  const navigate = useNavigate();
  const routeParams = useParams();
  const taskId = routeParams.taskId;
  const sampleId = routeParams.sampleId;

  const clickSample = async function () {
    // @ts-ignore
    const cResult = await annotationRef?.current?.getResult();
    const rResult = cResult[0].result;

    getSample(taskId, sampleId).then(({ data }) => {
      let annotated_count = 0;
      const dataParam = Object.assign({}, data.data, { result: rResult });

      if (_.get(data, 'data.state') !== 'SKIPPED') {
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
        // @ts-ignore
        updateSampleAnnotationResult(taskId, sampleId, { annotated_count, state: 'DONE', data: dataParam })
          .then(() => {
            navigate(window.location.pathname + '?' + 'POINTER' + new Date().getTime() + '&id=' + id);
          })
          .catch((error) => {
            commonController.notificationErrorMessage(error, 1);
          });
      } else {
        navigate(window.location.pathname + '?' + 'POINTER' + new Date().getTime() + '&id=' + id);
      }
    });
  };
  useEffect(() => {
    setCurrentSampleId(parseInt(window.location.pathname.split('/')[4]));
  }, []);
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
