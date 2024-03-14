import { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import {
  AttributeTree,
  CollapseWrapper,
  AttributeTreeWrapper,
  EllipsisText,
  uid,
  Tooltip,
  FlexLayout,
} from '@labelu/components-react';
import type {
  EnumerableAttribute,
  GlobalAnnotationType,
  TagAnnotationEntity,
  TextAnnotationEntity,
  TextAttribute,
} from '@labelu/interface';
import { DEFAULT_LABEL_COLOR, DEFAULT_LABEL_TEXT } from '@labelu/image';

import { ReactComponent as DeleteIcon } from '@/assets/icons/delete.svg';
import type { AnnotationDataInUI, AnnotationWithTool, GlobalAnnotation } from '@/context/annotation.context';
import { useAnnotationCtx } from '@/context/annotation.context';
import { useTool } from '@/context/tool.context';
import { useSample } from '@/context/sample.context';
import { tooltipStyle } from '@/Toolbar';

import AsideAttributeItem, { AttributeAction, Header } from './AsideAttributeItem';

const Wrapper = styled.div<{ collapsed: boolean }>`
  flex-shrink: 0;
  height: calc(100vh - var(--offset-top));
  overflow: auto;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(235, 236, 240, 1);

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
  border-top: 1px solid rgba(235, 236, 240, 1);
  cursor: pointer;

  &:hover {
    color: red;
  }
`;

type HeaderType = 'global' | 'label';

interface ConfirmProps {
  title: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const Button = styled.button<{ primary?: boolean }>`
  border: 0;

  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;

  ${({ primary }) =>
    primary &&
    css`
      background-color: var(--color-primary);
      color: #fff;
    `}
`;

function Confirm({ title, onConfirm, onCancel }: ConfirmProps) {
  return (
    <FlexLayout flex="column" gap="1rem" padding=".5rem">
      <FlexLayout.Item>{title}</FlexLayout.Item>
      <FlexLayout.Item flex items="center" justify="space-between" gap=".5rem">
        <Button onClick={onCancel}>取消</Button>
        <Button primary onClick={onConfirm}>
          确定
        </Button>
      </FlexLayout.Item>
    </FlexLayout>
  );
}

function ClearAction({ onClear }: { onClear: () => void }) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onClear?.();
    setOpen(false);
  };

  return (
    <Tooltip
      visible={open}
      trigger="click"
      overlayStyle={tooltipStyle}
      overlay={
        <Confirm
          title="确认清空标注吗？"
          onConfirm={handleConfirm}
          onCancel={() => {
            setOpen(false);
          }}
        />
      }
      placement="top"
    >
      <Footer onClick={() => setOpen((pre) => !pre)}>
        <DeleteIcon />
        &nbsp; 清空
      </Footer>
    </Tooltip>
  );
}

export function AttributePanel() {
  const { engine, globalToolConfig, config, labelMapping, preLabelMapping } = useTool();
  const { currentSample } = useSample();
  const {
    sortedImageAnnotations,
    annotationsWithGlobal,
    allAnnotationsMapping,
    selectedAnnotation,
    preAnnotationsWithGlobal,
    onAnnotationsChange,
    onAnnotationClear,
  } = useAnnotationCtx();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const globalAnnotations = useMemo(() => {
    return Object.values(annotationsWithGlobal).filter((item) =>
      ['text', 'tag'].includes(item.tool),
    ) as GlobalAnnotation[];
  }, [annotationsWithGlobal]);

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

    if (globalToolConfig.tag) {
      _globals.push(...globalToolConfig.tag);
    }

    if (globalToolConfig.text) {
      _globals.push(...globalToolConfig.text);
    }

    // 预标注的文本和分类需要跟用户配置合并且根据其value去重
    Object.values(preLabelMapping?.tag ?? {})?.forEach((item) => {
      if (!_globals.some((innerItem) => innerItem.value === item.value)) {
        _globals.push({ ...item, disabled: true } as EnumerableAttribute);
      }
    });

    Object.values(preLabelMapping?.text ?? {})?.forEach((item) => {
      if (!_globals.some((innerItem) => innerItem.value === item.value)) {
        _globals.push({ ...item, disabled: true } as TextAttribute);
      }
    });

    return _globals;
  }, [globalToolConfig.tag, globalToolConfig.text, preLabelMapping?.tag, preLabelMapping?.text]);

  const flatGlobalAnnotations = useMemo(() => {
    const result = globalAnnotations;

    if (globalAnnotations.length === 0) {
      [preAnnotationsWithGlobal?.tag, preAnnotationsWithGlobal?.text].forEach((values) => {
        if (values) {
          result.push(...(values as GlobalAnnotation[]));
        }
      });
    }

    return result;
  }, [globalAnnotations, preAnnotationsWithGlobal?.tag, preAnnotationsWithGlobal?.text]);

  const titles = useMemo(() => {
    const _titles = [];
    // 将文本描述和标签分类合并成全局配置
    if (globalToolConfig?.tag || globalToolConfig?.text || preLabelMapping.tag || preLabelMapping.text) {
      let isCompleted = false;

      const globalAnnotationMapping: Record<string, TextAnnotationEntity | TagAnnotationEntity> = {};

      globalAnnotations.forEach((item) => {
        const _key = Object.keys(item.value)[0];
        globalAnnotationMapping[_key] = item;
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
    globalToolConfig.tag,
    globalToolConfig.text,
    preLabelMapping.tag,
    preLabelMapping.text,
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
    (
      _changedValues: any,
      values: Record<GlobalAnnotationType, Record<string, TextAnnotationEntity | TagAnnotationEntity>>,
    ) => {
      const newAnnotations: AnnotationWithTool[] = [];
      const existAnnotations: GlobalAnnotation[] = [];

      for (const type of Object.keys(values)) {
        const annotationType = type as GlobalAnnotationType;
        const innerValues = values[type as GlobalAnnotationType];
        for (const field of Object.keys(innerValues)) {
          const item = innerValues[field];

          if (item.id && item.id in allAnnotationsMapping) {
            existAnnotations.push(item);
          } else {
            newAnnotations.push({
              id: item.id || uid(),
              type: annotationType,
              tool: annotationType,
              value: item.value,
            });
          }
        }
      }

      onAnnotationsChange([...existAnnotations, ...newAnnotations] as AnnotationWithTool[]);
    },
    [onAnnotationsChange, allAnnotationsMapping],
  );

  const handleClear = () => {
    if (!currentSample) {
      return;
    }

    onAnnotationClear();
    if (activeKey === 'label') {
      engine?.clearData();
    }
  };

  const collapseItems = useMemo(
    () =>
      Array.from(imageAnnotationsGroup).map(([label, _annotations]) => {
        const found = labelMapping[_annotations[0].tool]?.[label] ?? preLabelMapping?.[_annotations[0].tool]?.[label];
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
              {_annotations.map((item) => {
                const labelOfAnnotation = labelMapping[item.tool]?.[label] ?? preLabelMapping?.[item.tool]?.[label];

                return (
                  <AsideAttributeItem
                    key={item.id}
                    active={item.id === selectedAnnotation?.id}
                    order={item.order}
                    annotation={item}
                    labelText={labelOfAnnotation?.key ?? DEFAULT_LABEL_TEXT}
                    color={labelOfAnnotation?.color ?? DEFAULT_LABEL_COLOR}
                  />
                );
              })}
            </AsideWrapper>
          ),
        };
      }),
    [imageAnnotationsGroup, labelMapping, preLabelMapping, selectedAnnotation?.id],
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
      <ClearAction onClear={handleClear} />
    </Wrapper>
  );
}
