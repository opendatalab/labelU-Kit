import { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { AttributeTree, CollapseWrapper, AttributeTreeWrapper, EllipsisText, uid } from '@labelu/components-react';
import type {
  EnumerableAttribute,
  GlobalAnnotationType,
  MediaAnnotationInUI,
  TagAnnotationEntity,
  TextAnnotationEntity,
  TextAttribute,
} from '@labelu/interface';

import { ReactComponent as DeleteIcon } from '@/assets/icons/delete.svg';
import { useTool } from '@/context/tool.context';
import type { GlobalAnnotation } from '@/context/annotation.context';
import { useAnnotationCtx } from '@/context/annotation.context';
import { useSample } from '@/context/sample.context';

import AsideAttributeItem, { AttributeAction, Header } from './AsideAttributeItem';

const Wrapper = styled.div<{ collapsed: boolean }>`
  height: calc(100vh - var(--offset-top));
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

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
  const { config, labelMapping, preLabelMapping } = useTool();
  const { currentSample } = useSample();
  const {
    annotationsWithGlobal,
    allAnnotationsMapping,
    sortedMediaAnnotations,
    selectedAnnotation,
    preAnnotationsWithGlobal,
    onAnnotationsChange,
    onAnnotationClear,
  } = useAnnotationCtx();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const { globalAnnotations, globalAnnotationsWithPreAnnotation, mediaAnnotationGroup, defaultActiveKeys } =
    useMemo(() => {
      const mediaAnnotationGroupByLabel = new Map<string, MediaAnnotationInUI[]>();
      const _globalAnnotations = Object.values(annotationsWithGlobal).filter((item) => {
        return item.type === 'tag' || item.type === 'text';
      });
      const _globalAnnotationsWithPreAnnotation = [..._globalAnnotations];
      const preMediaAnnotationGroupByLabel = new Map<string, MediaAnnotationInUI[]>();
      const preMediaAnnotations = [
        ...(preAnnotationsWithGlobal?.segment ?? []),
        ...(preAnnotationsWithGlobal?.frame ?? []),
      ] as MediaAnnotationInUI[];

      if (!_globalAnnotations.length) {
        [preAnnotationsWithGlobal?.tag, preAnnotationsWithGlobal?.text].forEach((values) => {
          if (values) {
            _globalAnnotationsWithPreAnnotation.push(...(values as GlobalAnnotation[]));
          }
        });
      }

      for (const item of sortedMediaAnnotations) {
        if (!mediaAnnotationGroupByLabel.has(item.label)) {
          mediaAnnotationGroupByLabel.set(item.label, []);
        }

        mediaAnnotationGroupByLabel?.get(item.label)?.push(item);
      }

      for (const item of preMediaAnnotations) {
        if (!preMediaAnnotationGroupByLabel.has(item.label)) {
          preMediaAnnotationGroupByLabel.set(item.label, []);
        }

        preMediaAnnotationGroupByLabel?.get(item.label)?.push(item);
      }

      return {
        globalAnnotations: _globalAnnotations as GlobalAnnotation[],
        globalAnnotationsWithPreAnnotation: _globalAnnotationsWithPreAnnotation as GlobalAnnotation[],
        preMediaAnnotationGroup: preMediaAnnotationGroupByLabel,
        mediaAnnotationGroup: mediaAnnotationGroupByLabel,
        defaultActiveKeys: Array.from(mediaAnnotationGroupByLabel.keys()),
      };
    }, [
      annotationsWithGlobal,
      preAnnotationsWithGlobal?.segment,
      preAnnotationsWithGlobal?.frame,
      preAnnotationsWithGlobal?.tag,
      preAnnotationsWithGlobal?.text,
      sortedMediaAnnotations,
    ]);

  const globals = useMemo(() => {
    const _globals: (TextAttribute | EnumerableAttribute)[] = [];
    const _tagAnnotations = [];
    const _textAnnotations = [];

    Object.values(annotationsWithGlobal ?? {}).forEach((item) => {
      if (item.type === 'tag') {
        _tagAnnotations.push(item);
      }

      if (item.type === 'text') {
        _textAnnotations.push(item);
      }
    });

    if (config?.tag) {
      _globals.push(...config.tag);
    }

    if (config?.text) {
      _globals.push(...config.text);
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
  }, [annotationsWithGlobal, config?.tag, config?.text, preLabelMapping?.tag, preLabelMapping?.text]);

  const titles = useMemo(() => {
    const _titles = [];
    // 将文本描述和标签分类合并成全局配置
    if (
      config?.tag ||
      config?.text ||
      Object.keys(preLabelMapping.tag ?? {}).length ||
      Object.keys(preLabelMapping.text ?? {}).length
    ) {
      let isCompleted = false;

      const globalAnnotationMapping = globalAnnotations.reduce((acc, item) => {
        const key = Object.keys(item.value)[0];
        acc[key] = item;
        return acc;
      }, {} as Record<string, TextAnnotationEntity | TagAnnotationEntity>);

      /** 如果所有的文本描述都是必填的，那么只要有一个不存在，那么就是未完成  */
      isCompleted = [...(config?.text ?? []), ...(config?.tag ?? [])]
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
        subtitle: `${sortedMediaAnnotations.length}条`,
      });
    }

    return _titles;
  }, [
    config?.tag,
    config?.text,
    config?.segment,
    config?.frame,
    preLabelMapping.tag,
    preLabelMapping.text,
    globalAnnotations,
    sortedMediaAnnotations.length,
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

  const handleOnChange = (
    changedValues: Partial<Record<GlobalAnnotationType, Record<string, TextAnnotationEntity | TagAnnotationEntity>>>,
    values: Record<GlobalAnnotationType, Record<string, TextAnnotationEntity | TagAnnotationEntity>>,
  ) => {
    const newAnnotations = [];
    const existAnnotations: (TextAnnotationEntity | TagAnnotationEntity)[] = [];

    for (const type of Object.keys(changedValues)) {
      const annotationType = type as GlobalAnnotationType;
      const changedInnerValues = changedValues[type as GlobalAnnotationType] ?? {};
      const allInnerValues = values[annotationType] ?? [];
      for (const field of Object.keys(changedInnerValues)) {
        const item = allInnerValues[field];

        if (item.id && item.id in allAnnotationsMapping) {
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

    onAnnotationsChange([...existAnnotations, ...newAnnotations]);
  };

  const handleClear = () => {
    if (!currentSample) {
      return;
    }

    onAnnotationClear();
  };

  const collapseItems = useMemo(
    () =>
      Array.from(mediaAnnotationGroup).map(([label, _annotations]) => {
        const found = labelMapping[_annotations[0].type]?.[label] ?? preLabelMapping?.[_annotations[0].type]?.[label];
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
              {_annotations.map((item) => {
                const labelOfAnnotation = labelMapping[item.type]?.[label] ?? preLabelMapping?.[item.type]?.[label];

                return (
                  <AsideAttributeItem
                    key={item.id}
                    active={item.id === selectedAnnotation?.id}
                    order={item.order}
                    annotation={item}
                    labelText={labelOfAnnotation?.key ?? '无标签'}
                    color={labelOfAnnotation?.color ?? '#999'}
                  />
                );
              })}
            </AsideWrapper>
          ),
        };
      }),
    [mediaAnnotationGroup, labelMapping, preLabelMapping, selectedAnnotation?.id],
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
        <AttributeTree data={globalAnnotationsWithPreAnnotation} config={globals} onChange={handleOnChange} />
      </Content>
      <Footer onClick={handleClear}>
        <DeleteIcon />
        &nbsp; 清空
      </Footer>
    </Wrapper>
  );
}
