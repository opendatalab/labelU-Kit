import { useEffect, useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from 'antd';

import type { Dispatch } from '@/store';

import FormConfig from './formConfig';
import { TaskCreationContext } from '../../taskCreation.context';
import styles from './index.module.scss';

// 配置页的config统一使用此组件的state
const AnnotationConfig = () => {
  const dispatch = useDispatch<Dispatch>();
  const { updateFormData, formData, task = {} } = useContext(TaskCreationContext);
  const taskId = task.id;

  // const samples = useSelector((state: RootState) => state.sample.list);
  const {
    config = {
      tools: [],
      tagList: [],
      attribute: [],
      textConfig: [],
      commonAttributeConfigurable: false,
    },
  } = formData;

  useEffect(() => {
    if (!taskId) {
      return;
    }

    dispatch.sample.fetchSamples({
      task_id: taskId,
      pageNo: 1,
      pageSize: 1,
    });
  }, [dispatch.sample, taskId]);

  const updateConfig = useCallback(
    (field: string) => (value: any) => {
      updateFormData(`config.${field}`)(value);
    },
    [updateFormData],
  );

  useEffect(() => {
    // 初始化配置防抖方法
    const throttle = (fun: () => void, time: number) => {
      let timmer: any;
      const returnFunction = () => {
        if (timmer) {
          clearTimeout(timmer);
        }
        timmer = setTimeout(() => {
          fun();
        }, time);
      };
      return returnFunction;
    };
    // @ts-ignore
    window.throttle = throttle;
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.innerWrapper}>
        <div className={styles.header}>
          <span className={styles.title}>配置方式</span>
          <Button type="link">选择模板</Button>
        </div>
        <div className={styles.content}>
          <FormConfig config={config} updateConfig={updateConfig} />
        </div>
      </div>
      {/* <div className="configBox">
        <div className="leftSider" id="lefeSiderId">
          <div className="leftSiderTitle">
            <span className="leftTabContent">标注配置</span>
            <ConfigTemplate />
          </div>
          <div className="leftPane">
            <FormConfig config={config} updateConfig={updateConfig} />
          </div>
        </div>
        <div className="rightSider">
          {((tools && tools.length > 0) || !rightImg) && !isConfigError ? (
            <>
              <div className="rightHeader">
                <span className="leftSpan">标注预览</span>
              </div>
              <div className="rightContent">
                <AnnotationOperation
                  isPreview={true}
                  attributeList={commonAttributeConfigurable ? attribute : []}
                  tagConfigList={tagList}
                  imgList={previewFiles}
                  textConfig={textConfig}
                  goBack={goBack}
                  toolsBasicConfig={tools}
                />
              </div>
            </>
          ) : (
            <div className="notMatchBox">
              <img alt="not match config" src={rightImg} />
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default AnnotationConfig;
