import { Button, Tabs } from 'antd';
import type { FC } from 'react';
import React, { useContext, useEffect, useRef, useState } from 'react';

import DrageModel from '@/components/basic/modal';
import { TaskCreationContext } from '@/pages/createTask/taskCreation.context';

import { getLabelConfig } from './config';
import TemplateBox from './templateBox';

import './index.scss';

type TabPosition = 'left' | 'right' | 'top' | 'bottom';

interface LabelType {
  label: string;
  key: string;
  children: React.ReactNode;
}

const ConfigTemplate: FC = () => {
  const { task } = useContext(TaskCreationContext);
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
    new Promise(async () => {
      const result = await getLabelConfig();
      const neLabelTypes = labelTypes.map((item) => {
        if (item.label === '图片') {
          return {
            ...item,
            children: (
              <TemplateBox
                templates={result}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (task.status !== 'DRAFT' && task.status !== 'IMPORTED' && task.status !== 'CONFIGURED') {
      setIsShowChoose(false);
    }
  }, [task.status]);

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
