import React, { FC, ReactElement, useRef, useState } from 'react';
import HeaderTips from '../HeaderTips';
import GeneralOperation from '../GeneralOperation';
import LabelShowSetArea from './LabelShowSetArea';
import DrageModel from '@/components/dragModal';

const ActionOption: FC = () => {
  const [content, setContent] = useState<ReactElement>(<div />);
  const dragModalRef = useRef<any>();
  return (
    <div className='lbc-left-sider'>
      <DrageModel
        ref={dragModalRef}
        width={148}
        height={166}
        okWord='确认'
        closable={false}
        cancelWord='取消'
        content={content}
      />
      <a
        id='lbc-tool-set-id'
        onClick={(e) => {
          const boundingClientRect = document
            .getElementById(`lbc-tool-set-id`)
            ?.getBoundingClientRect() as {
            left: number;
            bottom: number;
          };
          const tmpBounds = {
            left: boundingClientRect.left,
            top: boundingClientRect.bottom,
          };
          dragModalRef.current.switchModal(true);
          dragModalRef.current.switchSetBounds(tmpBounds);
          setContent(<LabelShowSetArea />);
        }}
      >
        显示设置
      </a>
      <GeneralOperation />
      <HeaderTips />
    </div>
  );
};

export default ActionOption;
