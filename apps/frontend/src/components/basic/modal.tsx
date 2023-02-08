import { Modal } from 'antd';
import type { ReactNode } from 'react';
import React, { forwardRef, useImperativeHandle, useState } from 'react';

interface Iprops {
  // 弹框左上角位置
  width: number;
  content: () => React.ReactElement;
  title: string | ReactNode;
  okWord?: string;
  cancelWord?: string;
  okEvent?: () => void;
  cancelEvent?: () => void;
}

const DrageModel = (props: Iprops, ref: any) => {
  const { title, content } = props;
  const [isVisble, setIsVisible] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const handleOk = () => {
    setIsVisible(false);
  };

  const handleCancel = () => {
    setIsVisible(false);
  };

  useImperativeHandle(ref, () => ({
    switchModal: (isVisible: boolean) => {
      setIsVisible(isVisible);
    },
  }));

  return (
    <Modal
      className="Lmodal"
      footer={null}
      width={props.width}
      title={
        typeof title === 'string' ? (
          <div
            style={{
              width: '100%',
              cursor: 'move',
            }}
            onMouseOver={() => {
              if (disabled) {
                setDisabled(false);
              }
            }}
            onMouseOut={() => {
              setDisabled(true);
            }}
            onFocus={() => {}}
            onBlur={() => {}} // end
          >
            {title}
          </div>
        ) : (
          title
        )
      }
      visible={isVisble}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      {content()}
    </Modal>
  );
};

export default forwardRef(DrageModel);
