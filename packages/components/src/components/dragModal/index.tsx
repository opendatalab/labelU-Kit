import { Modal } from 'antd';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import Draggable from 'react-draggable';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  .labelu-draggable-modal {
    overflow: hidden !important;
  }
`;

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

interface ModalRendererProps {
  disabled: boolean;
  children: React.ReactNode;
  position: Position;
  setPosition: React.Dispatch<React.SetStateAction<Position>>;
}

const DEFAULT_OFFSET_TOP_OF_ANT_MODAL = 100;
const EXTRA_SPACE = 56;

const ModalRenderer = forwardRef<
  {
    setPosition: React.Dispatch<React.SetStateAction<Position>>;
  },
  ModalRendererProps
>(function RefedModalRenderer({ disabled, children, setPosition, position }: ModalRendererProps) {
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = dragRef.current?.getBoundingClientRect();
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

  useEffect(() => {
    const dragObserver = new MutationObserver(() => {
      const targetRect = dragRef.current?.getBoundingClientRect();
      const { clientHeight, clientWidth } = window.document.documentElement;

      if (!targetRect) {
        return;
      }

      if (targetRect?.bottom > clientHeight) {
        setPosition((pre) => ({
          ...pre,
          y: pre.y - (targetRect.bottom - clientHeight) - EXTRA_SPACE,
        }));
      }

      if (targetRect?.top < 0) {
        setPosition((pre) => ({
          ...pre,
          y: 0,
        }));
      }

      if (targetRect?.right > clientWidth) {
        setPosition((pre) => ({
          ...pre,
          x: pre.x - targetRect.width,
        }));
      }
    });

    dragObserver.observe(dragRef.current as Element, {
      childList: true,
      attributes: true,
      subtree: true,
    });

    return () => {
      dragObserver.disconnect();
    };
  }, [setPosition]);

  return (
    // @ts-ignore
    <Draggable disabled={disabled} bounds={bounds} onStart={onStart} positionOffset={position}>
      <div ref={dragRef}>{children}</div>
    </Draggable>
  );
});

const DraggableModel = (props: Iprops, ref: any) => {
  const { title, width = 500, okText, children, cancelText, beforeClose } = props;
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
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

  const updatePosition = useCallback(
    (newPosition: Position) => {
      const { clientWidth } = window.document.documentElement;

      setPosition({
        x: -clientWidth / 2 + newPosition.x - width / 2,
        y: -DEFAULT_OFFSET_TOP_OF_ANT_MODAL + newPosition.y + EXTRA_SPACE,
      });
    },
    [width],
  );

  useImperativeHandle(
    ref,
    () => ({
      switchModal: (value: boolean) => {
        setIsVisible(value);
      },
      setPosition: updatePosition,
    }),
    [updatePosition],
  );

  const bodyStyle = useMemo(() => {
    return {
      maxHeight: '65vh',
      overflow: 'auto',
    };
  }, []);

  return (
    <>
      <GlobalStyle />

      <Modal
        mask={false}
        footer={null}
        destroyOnClose
        modalRender={(modal) => (
          <ModalRenderer disabled={disabled} position={position} setPosition={setPosition}>
            {modal}
          </ModalRenderer>
        )}
        bodyStyle={bodyStyle}
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
        wrapClassName="labelu-draggable-modal"
      >
        {/* @ts-ignore */}
        {children}
      </Modal>
    </>
  );
};

export default forwardRef(DraggableModel);
