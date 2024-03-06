import { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { AttributeTree, CollapseWrapper, AttributeTreeWrapper, EllipsisText, uid } from '@labelu/components-react';
import type {
  EnumerableAttribute,
  GlobalAnnotationType,
  TagAnnotationEntity,
  TextAnnotationEntity,
  TextAttribute,
  VideoAnnotationData,
} from '@labelu/interface';

import { ReactComponent as DeleteIcon } from '@/assets/icons/delete.svg';

import { useAnnotator } from '../context';
import AsideAttributeItem, { AttributeAction, Header } from './AsideAttributeItem';

const Wrapper = styled.div<{ collapsed: boolean }>`
  height: calc(100vh - var(--offset-top));
  overflow: auto;
  display: flex;
  flex-direction: column;

  ${({ collapsed }) => (collapsed ? 'width: 0;' : 'width: 280px;')}
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

export function AttributePanel() {
  const {
    config,
    currentSample,
    onAnnotationsChange,
    annotationsMapping,
    onAnnotationsRemove,
    annotations,
    selectedAnnotation,
    attributeMapping,
  } = useAnnotator();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const { globalAnnotations, videoAnnotationsGroup, defaultActiveKeys } = useMemo(() => {
    const _globalAnnotations: (TextAnnotationEntity | TagAnnotationEntity)[] = [];
    currentSample?.annotations.forEach((item) => {
      if (['tag', 'text'].includes(item.type)) {
        _globalAnnotations.push(item as TextAnnotationEntity | TagAnnotationEntity);
      }
    });

    const videoAnnotationsGroupByLabel = new Map<string, VideoAnnotationData[]>();

    for (const item of annotations) {
      if (!videoAnnotationsGroupByLabel.has(item.label)) {
        videoAnnotationsGroupByLabel.set(item.label, []);
      }

      videoAnnotationsGroupByLabel?.get(item.label)?.push(item);
    }

    return {
      globalAnnotations: _globalAnnotations,
      videoAnnotationsGroup: videoAnnotationsGroupByLabel,
      defaultActiveKeys: Array.from(videoAnnotationsGroupByLabel.keys()),
    };
  }, [currentSample?.annotations, annotations]);

  const globals = useMemo(() => {
    const _globals: (TextAttribute | EnumerableAttribute)[] = [];

    if (!config) {
      return _globals;
    }

    if (config.tag) {
      _globals.push(...config.tag);
    }

    if (config.text) {
      _globals.push(...config.text);
    }

    return _globals;
  }, [config]);

  const titles = useMemo(() => {
    const _titles = [];
    // 将文本描述和标签分类合并成全局配置
    if (config?.tag || config?.text) {
      let isCompleted = false;

      const globalAnnotationMapping = globalAnnotations.reduce((acc, item) => {
        const key = Object.keys(item.value)[0];
        acc[key] = item;
        return acc;
      }, {} as Record<string, TextAnnotationEntity | TagAnnotationEntity>);

      /** 如果所有的文本描述都是必填的，那么只要有一个不存在，那么就是未完成  */
      isCompleted = [...(config.text ?? []), ...(config.tag ?? [])]
        .filter((item) => item.required)
        .every((item) => globalAnnotationMapping[item.value]?.value?.[item.value]);

      _titles.push({
        title: '全局',
        key: 'global' as const,
        subtitle: isCompleted ? '已完成' : '未完成',
      });
    }

    if (config?.segment || config?.frame) {
      _titles.push({
        title: '标记',
        key: 'label' as const,
        subtitle: `${annotations.length}条`,
      });
    }

    return _titles;
  }, [config?.frame, config?.segment, config?.tag, config?.text, globalAnnotations, annotations.length]);
  const [activeKey, setActiveKey] = useState<HeaderType>(globals.length === 0 ? 'label' : 'global');

  useEffect(() => {
    const handleCollapse = () => {
      setCollapsed((prev) => !prev);
    };

    document.addEventListener('attribute-collapse', handleCollapse as EventListener);

    return () => {
      document.removeEventListener('attribute-collapse', handleCollapse as EventListener);
    };
  }, []);

  const handleOnChange = (
    _changedValues: any,
    values: Record<GlobalAnnotationType, Record<string, TextAnnotationEntity | TagAnnotationEntity>>,
  ) => {
    const newAnnotations = [];
    const existAnnotations: (TextAnnotationEntity | TagAnnotationEntity)[] = [];

    for (const type of Object.keys(values)) {
      const annotationType = type as GlobalAnnotationType;
      const innerValues = values[type as GlobalAnnotationType];
      for (const field of Object.keys(innerValues)) {
        const item = innerValues[field];
        const configItems = config?.[annotationType] ?? [];

        // 不在用户配置的全局标签不保存
        // @ts-ignore
        if (!configItems.find((_item) => _item.value === field)) {
          continue;
        }

        if (item.id && item.id in annotationsMapping) {
          existAnnotations.push(item);
        } else {
          newAnnotations.push({
            id: item.id || uid(),
            type: annotationType,
            value: item.value,
          });
        }
      }
    }

    const _annotations =
      currentSample?.annotations.map((item) => {
        const existIndex = existAnnotations.findIndex((innerItem) => innerItem.id === item.id);
        if (existIndex >= 0) {
          return existAnnotations[existIndex];
        }

        return item;
      }) ?? [];
    onAnnotationsChange([..._annotations, ...newAnnotations]);
  };

  const handleClear = () => {
    if (!currentSample) {
      return;
    }

    if (activeKey === 'global') {
      onAnnotationsRemove(globalAnnotations);
    } else {
      onAnnotationsRemove(annotations);
    }
  };

  const collapseItems = useMemo(
    () =>
      Array.from(videoAnnotationsGroup).map(([label, _annotations]) => {
        const found = attributeMapping[_annotations[0].type]?.[label];
        const labelText = found ? found?.key ?? '无标签' : '无标签';

        return {
          label: (
            <Header>
              <EllipsisText maxWidth={180} title={labelText}>
                <div>{labelText}</div>
              </EllipsisText>

              <AttributeAction annotations={_annotations} showEdit={false} />
            </Header>
          ),
          key: label,
          children: (
            <AsideWrapper>
              {_annotations.map((item) => (
                <AsideAttributeItem
                  key={item.id}
                  active={item.id === selectedAnnotation?.id}
                  order={item.order}
                  annotation={item}
                  labelText={attributeMapping[item.type]?.[label]?.key ?? '无标签'}
                  color={attributeMapping[item.type]?.[label]?.color ?? '#999'}
                />
              ))}
            </AsideWrapper>
          ),
        };
      }),
    [attributeMapping, selectedAnnotation?.id, videoAnnotationsGroup],
  );

  return (
    <Wrapper collapsed={collapsed}>
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
