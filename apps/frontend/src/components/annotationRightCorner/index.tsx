import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button } from 'antd';

import currentStyles from './index.module.scss';
import { updateSampleState, updateSampleAnnotationResult, getSample } from '../../services/samples';
import commonController from '../../utils/common/common';
import { annotationRef } from '../../pages/annotation';
import TempStore from './tempStore';
import store from '../../stores';

interface AnnotationRightCornerProps {
  isLastSample: boolean;
}

const AnnotationRightCorner = ({ isLastSample }: AnnotationRightCornerProps) => {
  const navigate = useNavigate();
  const taskId = parseInt(window.location.pathname.split('/')[2]);
  const sampleId = parseInt(window.location.pathname.split('/')[4]);
  const [isSkippedShow, setIsSkippedShow] = useState('');

  const skipSample = () => {
    setIsSkippedShow('SKIPPED');
    getSample(taskId, sampleId)
      .then((sampleRes) => {
        if (sampleRes.status === 200) {
          updateSampleState(taskId, sampleId, sampleRes?.data.data.data, 'SKIPPED')
            .then((res) => {
              if (res.status === 200) {
                navigate(window.location.pathname + '?SKIPPED' + new Date().getTime());
              } else {
                commonController.notificationErrorMessage({ message: '请求跳过失败' }, 1);
              }
            })
            .catch((error) => {
              commonController.notificationErrorMessage(error, 1);
            });
        } else {
          commonController.notificationErrorMessage({ message: '请求任务数据出错' }, 1);
        }
      })
      .catch((error) => commonController.notificationErrorMessage(error, 1));
  };
  const cancelSkipSample = () => {
    setIsSkippedShow('NEW');
    getSample(taskId, sampleId)
      .then((sampleRes: any) => {
        if (sampleRes.status === 200) {
          updateSampleState(taskId, sampleId, sampleRes?.data.data.data, 'NEW')
            .then((res) => {
              if (res.status === 200) {
                navigate(window.location.pathname + '?NEW' + new Date().getTime());
              } else {
                commonController.notificationErrorMessage({ message: '请求跳过失败' }, 1);
              }
            })
            .catch((error) => {
              commonController.notificationErrorMessage(error, 1);
            });
        } else {
          commonController.notificationErrorMessage({ message: '请求任务数据出错' }, 1);
        }
      })
      .catch((error) => commonController.notificationErrorMessage(error, 1));
  };
  const [timestamp, setTimestamp] = useState(new Date().getTime());
  let timestampNew = new Date().getTime();
  // @ts-ignore
  const nextPage = async function () {
    // if (new Date().getTime() - timestamp <= 2000) {
    //   setTimestamp(new Date().getTime());
    //   return;
    // }
    // setTimestamp(new Date().getTime());
    timestampNew = new Date().getTime();
    // @ts-ignore
    const _sampleId = parseInt(window.location.pathname.split('/')[4]);
    // @ts-ignore
    const cResult = await annotationRef?.current?.getResult();
    const rResult = cResult[0].result;
    getSample(taskId, _sampleId)
      .then((res) => {
        if (res.status === 200) {
          const sampleResData = res.data.data.data;
          let annotated_count = 0;
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

            // @ts-ignore
            updateSampleAnnotationResult(taskId, _sampleId, { annotated_count, state: 'DONE', data: dataParam })
              .then((_res) => {
                if (_res.status === 200) {
                  // Ob.nextPageS.next('DONE');
                  navigate(window.location.pathname + '?DONE' + new Date().getTime());
                } else {
                  commonController.notificationErrorMessage({ message: '请求保存失败' }, 1);
                }
                // timestampNew = new Date().getTime();
              })
              .catch((error) => {
                commonController.notificationErrorMessage(error, 1);
                // timestampNew = new Date().getTime();
              });
          } else {
            navigate(window.location.pathname + '?JUMPDOWN' + new Date().getTime());
            // timestampNew = new Date().getTime();
          }
        } else {
          // timestampNew = new Date().getTime();
        }
      })
      .catch((error) => {
        commonController.notificationErrorMessage(error, 1);
        // timestampNew = new Date().getTime();
      });
  };

  const prevPage = async function () {
    if (new Date().getTime() - timestamp <= 2000) {
      setTimestamp(new Date().getTime());
      return;
    }
    setTimestamp(new Date().getTime());
    // @ts-ignore
    const _sampleId = parseInt(window.location.pathname.split('/')[4]);
    // @ts-ignore
    const cResult = await annotationRef?.current?.getResult();
    const rResult = cResult[0].result;

    getSample(taskId, _sampleId)
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
            // @ts-ignore
            updateSampleAnnotationResult(taskId, sampleId, { annotated_count, state: 'DONE', data: dataParam })
              .then((_res) => {
                if (_res.status === 200) {
                  // Ob.nextPageS.next('DONE');
                  navigate(window.location.pathname + '?PREV' + new Date().getTime());
                } else {
                  commonController.notificationErrorMessage({ message: '请求保存失败' }, 1);
                }
              })
              .catch((error) => {
                commonController.notificationErrorMessage(error, 1);
              });
          } else {
            navigate(window.location.pathname + '?JUMPUP' + new Date().getTime());
          }
        } else {
        }
      })
      .catch((error) => {
        commonController.notificationErrorMessage(error, 1);
      });
  };
  useEffect(() => {
    const currentSample = store.getState()?.samples?.currentSample;
    if (currentSample) {
      if (!currentSample.state) {
        setIsSkippedShow('NEW');
      } else {
        setIsSkippedShow(currentSample.state);
      }
    } else {
      commonController.notificationSuccessMessage({ message: '请求保存失败' }, 1);
    }
  }, [sampleId, taskId]);

  const onKeyDown = useCallback((e: any) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    timestampNew = new Date().getTime();
    if (TempStore.old != 0 && timestampNew - TempStore.old <= 500) {
      timestampNew = new Date().getTime();
      TempStore.old = new Date().getTime();
      return;
    }
    TempStore.old = new Date().getTime();
    const keyCode = e.keyCode;
    if (keyCode === 65) {
      // prevPage();
      commonController.debounce(prevPage, 1000)('');
    }
    if (keyCode === 68) {
      nextPage();
      // commonController.debounce(nextPage, 1000)('');
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keyup', onKeyDown);

    return () => {
      document.removeEventListener('keyup', onKeyDown);
    };
  }, [onKeyDown]);

  return (
    <div className={currentStyles.outerFrame} id="rightCorner">
      {/*<div className={currentStyles.left}*/}
      {/*     id = {'copyPre'}*/}
      {/*     onClick = { commonController.debounce(copyPre, 100) }*/}
      {/*>复制上张</div>*/}

      {/*<div className={currentStyles.right}*/}
      {/*     id = {'nextPage'}*/}
      {/*     onClick = { commonController.debounce(prevPage, 100) }*/}
      {/*>上一页</div>*/}
      <div className={currentStyles.right}>
        {isSkippedShow !== 'SKIPPED' && (
          <Button id={'skipped'} onClick={commonController.debounce(skipSample, 100)}>
            跳过
          </Button>
        )}
        {isSkippedShow === 'SKIPPED' && (
          <Button id={'skipped'} onClick={commonController.debounce(cancelSkipSample, 100)}>
            取消跳过
          </Button>
        )}
        <Button type="primary" id={'nextPage'} onClick={commonController.debounce(nextPage, 100)}>
          {isLastSample ? '完成' : '下一页'}
        </Button>
      </div>
    </div>
  );
};
export default AnnotationRightCorner;
