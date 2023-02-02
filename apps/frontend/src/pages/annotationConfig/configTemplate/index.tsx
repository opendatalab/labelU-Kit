import { Button, Tabs } from 'antd';
import React, { FC, useEffect, useRef, useState } from 'react';
import DrageModel from '../../../components/basic/modal';
import './index.less';
import { getLabelConfig } from './config';
import TmplateBox from './tmplateBox';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getTask } from '../../../services/samples';
import { updateStatus } from '../../../stores/task.store';
import commonController from '../../../utils/common/common';
type TabPosition = 'left' | 'right' | 'top' | 'bottom';

interface LabelType {
  label: string;
  key: string;
  children: React.ReactNode;
}

// test
const ConfigTemplate: FC = () => {
  const location = useLocation();
  const modalRef = useRef<any>();
  const [labelTypes, setLabelTypes] = useState<LabelType[]>([
    {
      label: '图片',
      key: '1',
      children: <></>,
    },
  ]);
  const [isShowChoose, setIsShowChoose] = useState(true);

  // const dispatch = useDispatch();//
  useEffect(() => {
    new Promise(async (resolve, reject) => {
      const result = await getLabelConfig();
      const neLabelTypes = labelTypes.map((item, index) => {
        if (item.label === '图片') {
          return {
            ...item,
            children: (
              <TmplateBox
                tempaltes={result}
                hideBox={() => {
                  modalRef.current.switchModal(false);
                }}
              />
            ),
          };
        }
        return item;
      });
      setLabelTypes(neLabelTypes);
    });
  }, []);
  useEffect(() => {
    // // @ts-ignore
    // if (!taskStatus && !(window.location.search.indexOf('noConfig=1')>-1)) {
    //   dispatch(updateStatus('IMPORTED'));
    //   setIsShowChoose(true);
    // }else{
    //   // @ts-ignore
    //   if(taskStatus !== 'DRAFT' && taskStatus !== 'IMPORTED' && taskStatus !== 'CONFIGURED'){
    //     setIsShowChoose(false);
    //   }
    // }
    let taskId = parseInt(window.location.pathname.split('/')[2]);
    getTask(taskId)
      .then((res: any) => {
        if (res.status === 200) {
          let newTaskStatus = res.data.data.status;
          if (newTaskStatus !== 'DRAFT' && newTaskStatus !== 'IMPORTED' && newTaskStatus !== 'CONFIGURED') {
            setIsShowChoose(false);
          }
        }
      })
      .catch((error) => commonController.notificationErrorMessage(error, 1));
  }, [window.location.pathname]);
  const content = () => {
    const tabPosition: TabPosition = 'left';
    return (
      <div className="contentBox">
        <Tabs tabPosition={tabPosition} items={labelTypes} />
      </div>
    );
  };

  const shwoModal = () => {
    modalRef.current.switchModal(true);
  };

  const titleNode = <div className="templateHeaderSpan">预设模板</div>;
  return (
    <div>
      {isShowChoose && (
        <React.Fragment>
          <Button onClick={shwoModal} className="rightTabContent" type="primary">
            选择模板
          </Button>
          <DrageModel ref={modalRef} title={titleNode} content={content} width={980} />
        </React.Fragment>
      )}
    </div>
  );
};

export default ConfigTemplate;
