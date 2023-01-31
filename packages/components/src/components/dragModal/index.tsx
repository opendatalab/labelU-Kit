import { Modal } from 'antd';
import React, { forwardRef, useImperativeHandle, useState } from 'react';

interface Iprops {
  // 弹框左上角位置
  width: number;
  content: React.ReactElement;
  title: string;
  okWord: string;
  cancelWord: string;
  okEvent?: () => void;
  cancelEvent?: () => void;
}

interface Bounds {
  left: number;
  top: number;
}

const DrageModel = (props: Iprops, ref: any) => {
  const { title, okWord, content, cancelWord } = props;

  const [isVisble, setIsVisible] = useState(false);
  //   const [coordinate,setCoordinate] = useState<Coordinate>({
  //     x:100,
  //     y:100
  //   })
  const [disabled, setDisabled] = useState(false);
  const [bounds, setBounds] = useState<Bounds>({
    left: 0,
    top: 0,
  });

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
    switchSetBounds: (bounds_: Bounds) => {
      setBounds(bounds_);
    },
  }));

  // 计算是否超出屏幕;超出后
  const inWindow = (left: number, top: number, startPosX: number, startPosY: number) => {
    const H = document.body.clientHeight;
    const W = document.body.clientWidth;
    if (
      (left < 20 && startPosX > left) ||
      (left > W - 20 && startPosX < left) ||
      (top < 20 && startPosY > top) ||
      (top > H - 20 && startPosY < top)
    ) {
      document.body.onmousemove = null;
      document.body.onmouseup = null;
      return false;
    }
    return true;
  };
  const onMouseDown = (e: { preventDefault: () => void; clientX: any; clientY: any }) => {
    e.preventDefault(); // 记录初始移动的鼠标位置
    const startPosX = e.clientX;
    const startPosY = e.clientY; // 添加鼠标移动事件
    document.body.onmousemove = (e_: MouseEvent) => {
      const left = e_.clientX - startPosX + bounds.left;
      const top = e_.clientY - startPosY + bounds.top;
      if (inWindow(e_.clientX, e_.clientY, startPosX, startPosY)) {
        setBounds({
          left: left,
          top: top,
        });
      }
    }; // 鼠标放开时去掉移动事件
    document.body.onmouseup = function () {
      document.body.onmousemove = null;
    };
  };

  return (
    <Modal
      mask={false}
      footer={null}
      style={{
        top: `${bounds.top}px`,
        left: `${bounds.left - props.width - 150}px`,
        margin: '0px 0px',
        maxWidth: props.width,
      }}
      title={
        <div
          onMouseDown={onMouseDown}
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
      }
      visible={isVisble}
      okText={okWord}
      cancelText={cancelWord}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      {content}
    </Modal>
  );
};

export default forwardRef(DrageModel);
