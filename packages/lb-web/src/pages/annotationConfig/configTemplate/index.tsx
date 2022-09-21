import { Button, Tabs } from 'antd';
import React, { FC, useEffect, useRef, useState } from 'react';
import DrageModel from '../../../components/basic/modal';
import './index.less';
import { imgLebalConfig, getLabelConfig } from './config';
import TmplateBox from './tmplateBox';
type TabPosition = 'left' | 'right' | 'top' | 'bottom';

interface LabelType {
  label: string;
  key: string;
  children: React.ReactNode;
}

const ConfigTemplate: FC = () => {
  const modalRef = useRef<any>();

  const [labelTypes, setLabelTypes] = useState<LabelType[]>([
    {
      label: '图片',
      key: '1',
      children: <></>
    }
  ]);

  useEffect(() => {
    new Promise(async (resolve, reject) => {
      const result = await getLabelConfig(imgLebalConfig);
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
            )
          };
        }
        return item;
      });
      setLabelTypes(neLabelTypes);
    });
  }, []);

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
      <Button onClick={shwoModal} className="rightTabContent" type="primary">
        选择模板
      </Button>
      <DrageModel ref={modalRef} title={titleNode} content={content} width={980} />
    </div>
  );
};

export default ConfigTemplate;
