import { createRef, useMemo, useRef } from 'react';
import { Annotator as ImageAnnotator } from '@labelu/image-annotator-react';
import type { AnnotatorRef as ImageAnnotatorRef } from '@labelu/image-annotator-react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Button, Modal } from 'antd';
import styled, { createGlobalStyle } from 'styled-components';
import { FlexLayout } from '@labelu/components-react';

import * as storage from '@/utils/storage';

import { Wrapper } from '../tasks.[id].samples.[id]/style';

const annotationRef = createRef<ImageAnnotatorRef>();

const config = {
  tag: [
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
  text: [
    {
      key: '请描述图片中都有哪些物象？',
      value: 'text-label-1',
      type: 'string',
      maxLength: 1000,
      stringType: 'text',
      defaultValue: '',
    },
  ],
  rect: {
    minWidth: 1,
    minHeight: 1,
    labels: [
      {
        color: '#c800ff',
        key: '笔记本电脑',
        value: 'laptop',
      },
    ],
  },
  point: {
    maxPointAmount: 100,
    labels: [
      {
        color: '#ff6600',
        key: '龙的眼睛',
        value: 'dragon-eye',
      },
    ],
  },
  polygon: {
    type: 'line',
    minPointAmount: 2,
    maxPointAmount: 100,
    edgeAdsorptive: false,
    labels: [
      {
        color: '#0062ff',
        key: '阿北',
        value: 'abe',
      },
    ],
  },
  line: {
    type: 'line',
    minPointAmount: 2,
    maxPointAmount: 100,
    edgeAdsorptive: false,
    labels: [
      {
        color: '#08bf36',
        key: '龙的犄角',
        value: 'dragon-horn',
      },
    ],
  },
};

const sample = {
  id: 18887712,
  name: 'image-task-demo',
  url: '/image-task-demo.png',

  data: storage.get('image-demo-guide::result') ?? {},
};

function isContainsAtLestTreeTools(result: any) {
  const { rect, point, polygon, line } = result;

  const annotations = [];

  if (rect && rect.length > 0) {
    annotations.push({
      tool: 'rect',
      annotations: rect.result,
    });
  }

  if (point && point.length > 0) {
    annotations.push({
      tool: 'point',
      annotations: point.result,
    });
  }

  if (polygon && polygon.length > 0) {
    annotations.push({
      tool: 'polygon',
      annotations: polygon.result,
    });
  }

  if (line && line.length > 0) {
    annotations.push({
      tool: 'line',
      annotations: line.result,
    });
  }

  return annotations.length >= 3;
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
    const res = annotationRef.current?.getAnnotations();

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

    storage.set('image-demo-guide::result', res);
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
      <ImageAnnotator
        offsetTop={160}
        renderSidebar={() => null}
        toolbarRight={topActionContent}
        ref={annotationRef}
        editingSample={sample}
        config={config}
      />
    </Wrapper>
  );
}
