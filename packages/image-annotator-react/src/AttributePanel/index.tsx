import { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { AttributeTree, CollapseWrapper, AttributeTreeWrapper, EllipsisText, uid } from '@labelu/components-react';
import type {
  EnumerableAttribute,
  GlobalAnnotationType,
  TagAnnotationEntity,
  TextAnnotationEntity,
  TextAttribute,
} from '@labelu/interface';
import { DEFAULT_LABEL_COLOR, DEFAULT_LABEL_TEXT } from '@labelu/image';

import { ReactComponent as DeleteIcon } from '@/assets/icons/delete.svg';
import type { AnnotationDataInUI, GlobalAnnotation } from '@/context/annotation.context';
import { useAnnotationCtx } from '@/context/annotation.context';
import { useTool } from '@/context/tool.context';
import { useSample } from '@/context/sample.context';

import AsideAttributeItem, { AttributeAction, Header } from './AsideAttributeItem';

const Wrapper = styled.div<{ collapsed: boolean }>`
  flex-shrink: 0;
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
  const { engine, globalToolConfig, config, labelMapping } = useTool();
  const { currentSample } = useSample();
  const {
    sortedImageAnnotations,
    annotationsWithGlobal,
    allAnnotationsMapping,
    selectedAnnotation,
    onGlobalAnnotationsChange,
    onImageAnnotationsClear,
    onGlobalAnnotationClear,
  } = useAnnotationCtx();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const globalAnnotations = annotationsWithGlobal?.global;

  const { imageAnnotationsGroup, defaultActiveKeys } = useMemo(() => {
    const imageAnnotationsGroupByLabel = new Map<string, AnnotationDataInUI[]>();

    for (const item of sortedImageAnnotations) {
      const label = item.label ?? 'noneAttribute';

      if (!imageAnnotationsGroupByLabel.has(label)) {
        imageAnnotationsGroupByLabel.set(label, []);
      }

      imageAnnotationsGroupByLabel?.get(label)?.push(item);
    }

    return {
      imageAnnotationsGroup: imageAnnotationsGroupByLabel,
      defaultActiveKeys: Array.from(imageAnnotationsGroupByLabel.keys()),
    };
  }, [sortedImageAnnotations]);

  const globals = useMemo(() => {
    const _globals: (TextAttribute | EnumerableAttribute)[] = [];

    if (!globalToolConfig) {
      return _globals;
    }

    if (globalToolConfig.tag) {
      _globals.push(...globalToolConfig.tag);
    }

    if (globalToolConfig.text) {
      _globals.push(...globalToolConfig.text);
    }

    return _globals;
  }, [globalToolConfig]);

  const flatGlobalAnnotations = useMemo(() => {
    const result: GlobalAnnotation[] = [];

    if (!globalAnnotations) {
      return result;
    }

    Object.keys(globalAnnotations).forEach((key) => {
      result.push(...globalAnnotations[key as GlobalAnnotationType]);
    });

    return result;
  }, [globalAnnotations]);

  const titles = useMemo(() => {
    const _titles = [];
    // 将文本描述和标签分类合并成全局配置
    if (globalToolConfig?.tag || globalToolConfig?.text) {
      let isCompleted = false;

      const globalAnnotationMapping: Record<string, TextAnnotationEntity | TagAnnotationEntity> = {};

      Object.keys(globalAnnotations).forEach((key) => {
        const items = globalAnnotations[key as GlobalAnnotationType];

        items.forEach((item) => {
          const _key = Object.keys(item.value)[0];
          globalAnnotationMapping[_key] = item;
        });
      });

      /** 如果所有的文本描述都是必填的，那么只要有一个不存在，那么就是未完成  */
      isCompleted = [...(globalToolConfig.text ?? []), ...(globalToolConfig.tag ?? [])]
        .filter((item) => item.required)
        .every((item) => globalAnnotationMapping[item.value]?.value?.[item.value]);

      _titles.push({
        title: '全局',
        key: 'global' as const,
        subtitle: isCompleted ? '已完成' : '未完成',
      });
    }

    if (config?.line || config?.point || config?.polygon || config?.rect || config?.cuboid) {
      _titles.push({
        title: '标记',
        key: 'label' as const,
        subtitle: `${sortedImageAnnotations.length}条`,
      });
    }

    return _titles;
  }, [
    globalToolConfig?.tag,
    globalToolConfig?.text,
    config?.line,
    config?.point,
    config?.polygon,
    config?.rect,
    config?.cuboid,
    globalAnnotations,
    sortedImageAnnotations.length,
  ]);
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

  const handleOnChange = useCallback(
    (_changedValues: any, values: any[], type: GlobalAnnotationType) => {
      const newAnnotations = [];
      const existAnnotations: GlobalAnnotation[] = [];

      for (const item of values) {
        if (item.id && item.id in allAnnotationsMapping) {
          existAnnotations.push(item);
        } else {
          newAnnotations.push({
            id: item.id || uid(),
            type,
            value: item.value,
          });
        }
      }

      const _annotations = {
        ...globalAnnotations,
      };

      Object.keys(_annotations).forEach((key) => {
        const toolAnnotations = _annotations[key as GlobalAnnotationType].map((item) => {
          const existIndex = existAnnotations.findIndex((innerItem) => innerItem.id === item.id);

          if (existIndex >= 0) {
            return existAnnotations[existIndex];
          }

          return item;
        });

        _annotations[key as GlobalAnnotationType] = toolAnnotations;
      });

      newAnnotations.forEach((item) => {
        if (!_annotations[item.type]) {
          _annotations[item.type] = [];
        }

        _annotations[item.type].push(item);
      });

      onGlobalAnnotationsChange(_annotations);
    },
    [globalAnnotations, allAnnotationsMapping, onGlobalAnnotationsChange],
  );

  const handleClear = () => {
    if (!currentSample) {
      return;
    }

    if (activeKey === 'global') {
      onGlobalAnnotationClear();
    } else {
      engine?.clearData();
      onImageAnnotationsClear();
    }
  };

  const collapseItems = useMemo(
    () =>
      Array.from(imageAnnotationsGroup).map(([label, _annotations]) => {
        const found = labelMapping[_annotations[0].tool]?.[label];
        const labelText = found ? found?.key ?? DEFAULT_LABEL_TEXT : DEFAULT_LABEL_TEXT;

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
                  labelText={labelMapping[item.tool]?.[label]?.key ?? DEFAULT_LABEL_TEXT}
                  color={labelMapping[item.tool]?.[label]?.color ?? DEFAULT_LABEL_COLOR}
                />
              ))}
            </AsideWrapper>
          ),
        };
      }),
    [labelMapping, selectedAnnotation?.id, imageAnnotationsGroup],
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
        <AttributeTree data={flatGlobalAnnotations} config={globals} onChange={handleOnChange} />
        <CollapseWrapper defaultActiveKey={defaultActiveKeys} items={collapseItems} />
      </Content>
      <Footer onClick={handleClear}>
        <DeleteIcon />
        &nbsp; 清空
      </Footer>
    </Wrapper>
  );
}
