import { Modal } from 'antd';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import Draggable from 'react-draggable';

interface Iprops {
  // 弹框左上角位置
  width: number;
  children: React.ReactNode;
  title: string;
  okText: string;
  cancelText: string;
  beforeClose?: () => Promise<unknown>;
}

interface Position {
  x: number;
  y: number;
}

const DEFAULT_OFFSET_TOP_OF_ANT_MODAL = 100;
const EXTRA_SPACE = 56;

const DraggableModel = (props: Iprops, ref: any) => {
  const draggleRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const { title, width = 500, okText, children, cancelText, beforeClose } = props;

  const [isVisible, setIsVisible] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const handleOk = () => {
    setIsVisible(false);
  };

  const handleCancel = () => {
    if (beforeClose) {
      Promise.resolve(beforeClose())
        .then(() => {
          setIsVisible(false);
        })
        .catch(() => {});
    } else {
      setIsVisible(false);
    }
  };

  const updatePosition = (newPosition: Position) => {
    const { clientWidth } = window.document.documentElement;

    setPosition({
      x: -clientWidth / 2 + newPosition.x - width / 2,
      y: -DEFAULT_OFFSET_TOP_OF_ANT_MODAL + newPosition.y + EXTRA_SPACE,
    });
  };

  useImperativeHandle(ref, () => ({
    switchModal: (value: boolean) => {
      setIsVisible(value);
    },
    setBounds,
    setPosition: updatePosition,
  }));

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  return (
    <Modal
      mask={false}
      footer={null}
      destroyOnClose
      modalRender={(modal) => (
        <Draggable disabled={disabled} bounds={bounds} onStart={onStart} positionOffset={position}>
          <div ref={draggleRef}>{modal}</div>
        </Draggable>
      )}
      title={
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
      }
      open={isVisible}
      okText={okText}
      cancelText={cancelText}
      onOk={handleOk}
      onCancel={handleCancel}
      width={width}
    >
      {/* @ts-ignore */}
      {children}
    </Modal>
  );
};

export default forwardRef(DraggableModel);
