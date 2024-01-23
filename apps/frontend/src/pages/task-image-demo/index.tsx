import { createRef, useMemo, useRef } from 'react';
import AnnotationOperation from '@labelu/components';
import '@labelu/components/dist/index.css';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Button, Modal } from 'antd';
import styled, { createGlobalStyle } from 'styled-components';
import { FlexLayout } from '@labelu/components-react';

import { Wrapper } from '../tasks.[id].samples.[id]/style';

export const annotationRef = createRef();
export const videoAnnotationRef = createRef();
export const audioAnnotationRef = createRef();

const sample = {
  id: 18887712,
  name: 'image-task-demo',
  url: '/image-task-demo.png',
  result: '{}',
};
const config = {
  tools: [
    {
      tool: 'tagTool',
      config: {
        textConfigurable: false,
        attributes: [
          {
            key: '图片的种类是？',
            value: 'tag-label-1',
            type: 'enum',
            options: [
              {
                key: '卡通',
                value: 'tag-label-1-1',
              },
              {
                key: '人像',
                value: '1',
              },
              {
                key: '风景',
                value: '2',
              },
            ],
          },
        ],
      },
    },
    {
      tool: 'textTool',
      config: {
        textConfigurable: false,
        attributes: [
          {
            key: '请描述图片中都有哪些物象？',
            value: 'text-label-1',
            type: 'string',
            maxLength: 1000,
            stringType: 'text',
            defaultValue: '',
          },
        ],
      },
    },
    {
      tool: 'rectTool',
      config: {
        attributeConfigurable: true,
        minWidth: 1,
        minHeight: 1,
        attributes: [
          {
            color: '#c800ff',
            key: '笔记本电脑',
            value: 'label-1',
          },
        ],
      },
    },
    {
      tool: 'pointTool',
      config: {
        attributeConfigurable: true,
        upperLimit: 100,
        attributes: [
          {
            color: '#ff6600',
            key: '龙的眼睛',
            value: 'label-1',
          },
        ],
      },
    },
    {
      tool: 'polygonTool',
      config: {
        attributeConfigurable: true,
        lineColor: 0,
        lineType: 0,
        lowerLimitPointNum: 2,
        upperLimitPointNum: 100,
        edgeAdsorption: false,
        attributes: [
          {
            color: '#0062ff',
            key: '阿北',
            value: 'label-1',
          },
        ],
      },
    },
    {
      tool: 'lineTool',
      config: {
        attributeConfigurable: true,
        lineType: 0,
        lowerLimitPointNum: 2,
        upperLimitPointNum: 100,
        edgeAdsorption: false,
        attributes: [
          {
            color: '#08bf36',
            key: '龙的犄角',
            value: 'label-1',
          },
        ],
      },
    },
  ],
};

function isContainsAtLestTreeTools(result: any) {
  const { rectTool, pointTool, polygonTool, lineTool } = result;

  const annotaitons = [];

  if (rectTool && rectTool.result && rectTool.result.length > 0) {
    annotaitons.push({
      tool: 'rectTool',
      annotations: rectTool.result,
    });
  }

  if (pointTool && pointTool.result && pointTool.result.length > 0) {
    annotaitons.push({
      tool: 'pointTool',
      annotations: pointTool.result,
    });
  }

  if (polygonTool && polygonTool.result && polygonTool.result.length > 0) {
    annotaitons.push({
      tool: 'polygonTool',
      annotations: polygonTool.result,
    });
  }

  if (lineTool && lineTool.result && lineTool.result.length > 0) {
    annotaitons.push({
      tool: 'lineTool',
      annotations: lineTool.result,
    });
  }

  return annotaitons.length >= 3;
}

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  height: 300px;

  .ant-btn {
    border-radius: 3px;
  }

  &.incomplete {
    gap: 0;
    p {
      margin-bottom: 4rem;
    }
  }
`;

const GlobalStyle = createGlobalStyle`
  .labelu-image-demo-complete-modal {
    .ant-modal-content {
      background: linear-gradient(to bottom right, #EFE0FF 0%, #fff 50%, #E7F2FF 100%);
    }

    .ant-modal-confirm-paragraph {
      max-width: 100%;
    }
  }
`;

const CompleteContent = () => {
  return (
    <Content>
      <h2>恭喜您完成任务 &nbsp; 🎉</h2>
      <a href="/tasks">
        <Button size="large" type="primary">
          返回主页
        </Button>
      </a>
    </Content>
  );
};

const InCompleteContent = ({ onClose }: { onClose: () => void }) => {
  return (
    <Content className="incomplete">
      <h2>您尚未完成任务</h2>
      <p>请您至少完成四项任务要求中的任意三项</p>
      <FlexLayout flex="row" gap="1rem">
        <a href="/tasks">
          <Button size="large">返回主页</Button>
        </a>
        <Button type="primary" size="large" onClick={onClose}>
          继续标注
        </Button>
      </FlexLayout>
    </Content>
  );
};

export default function ImageTaskDemo() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const modalRef = useRef<any>(null);

  const handleComplete = () => {
    modalRef.current?.destroy();
    annotationRef.current?.getResult?.().then((res) => {
      if (isContainsAtLestTreeTools(res)) {
        modalRef.current = Modal.info({
          centered: true,
          content: <CompleteContent />,
          icon: null,
          width: 420,
          className: 'labelu-image-demo-complete-modal',
          title: null,
          footer: null,
        });

        if (window.AnalyzeWiz) {
          window.AnalyzeWiz.dispatch({
            type: 'button_click',
            resourceId: 'demo-complete',
            resourceType: 'button',
          });
        }
      } else {
        const modal = Modal.info({
          centered: true,
          content: <InCompleteContent onClose={() => modal.destroy()} />,
          icon: null,
          width: 420,
          className: 'labelu-image-demo-complete-modal',
          title: null,
          footer: null,
        });

        if (window.AnalyzeWiz) {
          window.AnalyzeWiz.dispatch({
            type: 'button_click',
            resourceId: 'demo-incomplete',
            resourceType: 'button',
          });
        }
      }
    });
  };

  const topActionContent = (
    <Button type="primary" onClick={handleComplete}>
      完成
    </Button>
  );

  const isLoading = useMemo(() => isFetching > 0 || isMutating > 0, [isFetching, isMutating]);

  return (
    <Wrapper flex="column" full loading={isLoading}>
      <GlobalStyle />
      <AnnotationOperation
        leftSiderContent={null}
        topActionContent={topActionContent}
        loading={isLoading}
        ref={annotationRef}
        isPreview={false}
        sample={sample}
        config={config}
        isShowOrder={false}
      />
    </Wrapper>
  );
}
