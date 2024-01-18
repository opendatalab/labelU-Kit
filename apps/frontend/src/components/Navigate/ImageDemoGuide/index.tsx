import { BulbOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { Button, Modal, Popover, Tabs } from 'antd';
import { useLayoutEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const ContentWrapper = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;

  .ant-tabs-ink-bar {
    display: none;
  }

  .ant-tabs-nav::before {
    display: none;
  }

  .ant-btn {
    border-radius: 3px;
  }
`;

const StartWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 0 5rem;
  min-height: 343px;
  text-align: center;
  line-height: 2;
`;

const VideoContent = styled.div`
  display: flex;
  flex-direction: column;

  video {
    width: 100%;
    min-height: 354px;
    border-radius: 5px;
  }
`;

const start = (
  <StartWrapper>
    <h2>开始任务吧 &nbsp; 🎉</h2>
    <p>欢迎进入OpenXLab的独特新春之旅，请您至少完成四项任务要求中的任意三项，并点击“完成”按钮提交标注任务。</p>
    <p>
      详情可查看 &nbsp;
      <a href="https://google.com" target="_blank" rel="noreferrer">
        活动介绍
      </a>
    </p>
  </StartWrapper>
);

const items: TabsProps['items'] = [
  {
    key: 'task-1',
    label: '任务一',
    children: (
      <div style={{ textAlign: 'center' }}>
        <p>请用“拉框”工具标注“笔记本电脑”</p>
        <video autoPlay controls>
          <source src="/image-demo-guide-videos/rect.mp4" type="video/mp4" />
        </video>
      </div>
    ),
  },
  {
    key: 'task-2',
    label: '任务二',
    children: (
      <div style={{ textAlign: 'center' }}>
        <p>请用“标点”工具标记“龙的眼睛”</p>
        <video autoPlay controls>
          <source src="/image-demo-guide-videos/point.mp4" type="video/mp4" />
        </video>
      </div>
    ),
  },
  {
    key: 'task-3',
    label: '任务三',
    children: (
      <div style={{ textAlign: 'center' }}>
        <p>请用“多边形”工具标记“阿北”</p>
        <video autoPlay controls>
          <source src="/image-demo-guide-videos/polygon.mp4" type="video/mp4" />
        </video>
      </div>
    ),
  },
  {
    key: 'task-4',
    label: '任务四',
    children: (
      <div style={{ textAlign: 'center' }}>
        <p>请用“标线”工具标记“龙的犄角”</p>
        <video autoPlay controls>
          <source src="/image-demo-guide-videos/line.mp4" type="video/mp4" />
        </video>
      </div>
    ),
  },
];

const VideoTab = () => {
  return (
    <VideoContent>
      <Tabs style={{ width: '100%' }} defaultActiveKey="1" items={items} destroyInactiveTabPane />
    </VideoContent>
  );
};

const Footer = styled.div``;

const GlobalStyle = createGlobalStyle`
  .labelu-image-demo-guide-modal {
    .ant-modal-content {
      background: linear-gradient(to bottom right, rgba(204, 152, 255, 0.20) 0% , #fff 50%, rgba(81, 160, 255, 0.14) 100%);
          background-color: #fff;
    }

    .ant-modal-confirm-paragraph {
      max-width: 100%;
    }

    .ant-popover-content {
      width: 600px;
      zoom: 0.5;
    }

    .ant-popover-inner {
      border-radius: 12px;
      background: linear-gradient(to bottom right, rgba(204, 152, 255, 0.20) 0% , #fff 50%, rgba(81, 160, 255, 0.14) 100%);
          background-color: #fff;

      ${VideoContent} {
        padding: 0 1rem;
      }
    }
  }
`;

const Content = ({ popover, onClose }: { popover?: boolean; onClose?: () => void }) => {
  const [isTaskGuideVisible, setIsTaskGuideVisible] = useState(false);
  const handleNextStep = () => {
    setIsTaskGuideVisible(true);

    if (isTaskGuideVisible) {
      onClose?.();
    }
  };

  return (
    <ContentWrapper>
      {!isTaskGuideVisible && start}
      {isTaskGuideVisible && <VideoTab />}
      <Footer>
        {!popover && isTaskGuideVisible && (
          <Button type="primary" onClick={handleNextStep}>
            知道了
          </Button>
        )}
        {!isTaskGuideVisible && (
          <Button type="primary" onClick={handleNextStep}>
            下一步
          </Button>
        )}
      </Footer>
    </ContentWrapper>
  );
};

export default function ImageDemoGuide({ visible }: { visible?: boolean }) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const buttonRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (visible && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const mouseEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        screenX: buttonRect.left,
        screenY: buttonRect.top,
        clientX: buttonRect.left,
        clientY: buttonRect.top,
      });
      buttonRef.current.dispatchEvent(mouseEvent);
    }
  }, [visible]);

  const handleOpenGuide = () => {
    setModalOpen(true);
    setOpen(false);
  };

  const handleCloseGuide = () => {
    setModalOpen(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <GlobalStyle />
      <Popover
        overlayClassName="labelu-image-demo-guide-modal"
        content={<Content popover />}
        destroyTooltipOnHide
        open={open}
        arrow={false}
        onOpenChange={setOpen}
      >
        <Button
          type="link"
          style={{ color: 'rgba(0, 0, 0, 0.85)' }}
          icon={<BulbOutlined />}
          ref={buttonRef}
          onClick={handleOpenGuide}
        >
          任务描述
        </Button>
      </Popover>
      <Modal
        open={modalOpen}
        footer={null}
        title={null}
        centered
        width={600}
        destroyOnClose
        className="labelu-image-demo-guide-modal"
        onCancel={handleCloseGuide}
      >
        <Content />
      </Modal>
    </>
  );
}
