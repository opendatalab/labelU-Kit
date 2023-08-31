import { useContext, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { AttributeTree, CollapseWrapper, AttributeTreeWrapper } from '@label-u/components-react';
import type { TagAnnotationEntity, TextAnnotationEntity, VideoAnnotationData } from '@label-u/interface';

import { ReactComponent as DeleteIcon } from '@/assets/icons/delete.svg';

import EditorContext from '../context';
import AsideAttributeItem, { AttributeAction, Header } from './AsideAttributeItem';

const Wrapper = styled.div`
  width: 280px;
  grid-area: attribute;
  height: var(--height);
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

const AttributeHeaderItem = styled.div<{ active: boolean }>`
  height: 100%;
  display: flex;
  padding: 0 0.5rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 2px solid transparent;

  ${({ active }) =>
    active &&
    css`
      color: var(--color-primary);
      border-bottom: 2px solid var(--color-primary);
    `}

  &:hover {
    color: var(--color-primary);
  }

  .attribute__status {
    font-size: 12px;
    color: #999;
  }
`;

const TabHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  width: 100%;
  align-items: center;
  justify-content: space-around;
  height: 68px;
  border-bottom: #e5e5e5 1px solid;
`;

const AsideWrapper = styled.div``;

const Content = styled.div<{ activeKey: HeaderType }>`
  padding: 1rem 0;
  flex: 1 auto;
  min-height: 0;
  overflow: auto;

  & > ${AttributeTreeWrapper} {
    display: ${({ activeKey }) => (activeKey === 'global' ? 'block' : 'none')};
  }

  & > ${CollapseWrapper as any} {
    display: ${({ activeKey }) => (activeKey === 'label' ? 'block' : 'none')};
  }
`;

const Footer = styled.div`
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
  border-top: #e5e5e5 1px solid;
  cursor: pointer;

  &:hover {
    color: red;
  }
`;

type HeaderType = 'global' | 'label';

export default function Attribute() {
  const {
    videoWrapperRef,
    config,
    currentSample,
    onAnnotationsChange,
    annotationsMapping,
    onAnnotationsRemove,
    attributes,
    selectedAnnotation,
    attributeMapping,
  } = useContext(EditorContext);
  const [height, setHeight] = useState<number>(0);
  const [activeKey, setActiveKey] = useState<HeaderType>('global');
  const { globalAnnotations, videoAnnotations, flattenVideoAnnotations, defaultActiveKeys } = useMemo(() => {
    const _globalAnnotations: (TextAnnotationEntity | TagAnnotationEntity)[] = [];
    const _videoAnnotations: VideoAnnotationData[] = [];
    currentSample?.annotations.forEach((item) => {
      if (['tag', 'text'].includes(item.type)) {
        _globalAnnotations.push(item as TextAnnotationEntity | TagAnnotationEntity);
      }

      if (['segment', 'frame'].includes(item.type)) {
        _videoAnnotations.push(item as VideoAnnotationData);
      }
    });
    _videoAnnotations.sort((a, b) => {
      return a.order - b.order;
    });

    const videoAnnotationsGroupByLabel = new Map<string, VideoAnnotationData[]>();

    for (const item of _videoAnnotations) {
      if (!videoAnnotationsGroupByLabel.has(item.label)) {
        videoAnnotationsGroupByLabel.set(item.label, []);
      }

      videoAnnotationsGroupByLabel?.get(item.label)?.push(item);
    }

    return {
      globalAnnotations: _globalAnnotations,
      videoAnnotations: videoAnnotationsGroupByLabel,
      flattenVideoAnnotations: _videoAnnotations,
      defaultActiveKeys: Array.from(videoAnnotationsGroupByLabel.keys()),
    };
  }, [currentSample?.annotations]);

  const titles = [];
  const globals = [];

  // 将文本描述和标签分类合并成全局配置
  if (config?.tag || config?.text) {
    titles.push({
      title: '全局',
      key: 'global' as const,
      subtitle: globalAnnotations.length > 0 ? '已完成' : '未完成',
    });

    if (config.tag) {
      globals.push(...config.tag);
    }

    if (config.text) {
      globals.push(...config.text);
    }
  }

  if (attributes) {
    titles.push({
      title: '标记',
      key: 'label' as const,
      subtitle: `${flattenVideoAnnotations.length}条`,
    });
  }

  useEffect(() => {
    setTimeout(() => {
      setHeight(videoWrapperRef.current?.clientHeight || 0);
    });
  });

  const handleOnChange = (_changedValues: any, values: any[]) => {
    // 只要其中之一不存在，那么所有该类型的标注即不存在
    if (!(values[0].id in annotationsMapping)) {
      onAnnotationsChange([...(currentSample?.annotations ?? []), ...values]);
    } else {
      onAnnotationsChange(
        currentSample!.annotations.map((item) => {
          const existIndex = values.findIndex((innerItem) => innerItem.id === item.id);
          if (existIndex >= 0) {
            return values[existIndex];
          }

          return item;
        }),
      );
    }
  };

  const handleClear = () => {
    if (!currentSample) {
      return;
    }

    if (activeKey === 'global') {
      onAnnotationsRemove(globalAnnotations);
    } else {
      onAnnotationsRemove(flattenVideoAnnotations);
    }
  };

  const collapseItems = useMemo(
    () =>
      Array.from(videoAnnotations).map(([label, annotations]) => {
        const found = attributeMapping[annotations[0].type]?.[label];
        const labelText = found ? found?.key ?? '无标签' : '无标签';
        return {
          label: (
            <Header>
              {labelText}
              <AttributeAction annotations={annotations} showEdit={false} />
            </Header>
          ),
          key: label,
          children: (
            <AsideWrapper>
              {annotations.map((item) => (
                <AsideAttributeItem
                  key={item.id}
                  active={item.id === selectedAnnotation?.id}
                  order={item.order}
                  annotation={item}
                  labelText={labelText}
                  color={found ? found.color : '#999'}
                />
              ))}
            </AsideWrapper>
          ),
        };
      }),
    [attributeMapping, selectedAnnotation?.id, videoAnnotations],
  );

  if (!height) {
    return null;
  }

  return (
    // @ts-ignore
    <Wrapper style={{ '--height': `${height}px` }}>
      <TabHeader className="attribute-header">
        {titles.map((item) => {
          return (
            <AttributeHeaderItem
              onClick={() => setActiveKey(item.key)}
              active={item.key === activeKey}
              key={item.key}
              className="attribute-header__item"
            >
              <div>{item.title}</div>
              <div className="attribute__status">{item.subtitle}</div>
            </AttributeHeaderItem>
          );
        })}
      </TabHeader>
      <Content activeKey={activeKey}>
        <CollapseWrapper defaultActiveKey={defaultActiveKeys} items={collapseItems} />
        <AttributeTree data={globalAnnotations} config={globals} onChange={handleOnChange} />
      </Content>
      <Footer onClick={handleClear}>
        <DeleteIcon />
        &nbsp; 清空
      </Footer>
    </Wrapper>
  );
}
