import React, { createRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { DraggableModalRef, ValidationContextType } from '@labelu/components-react';
import { DraggableModel, AttributeForm, EllipsisText } from '@labelu/components-react';
import type { Attribute, AttributeValue, EnumerableAttribute, ILabel, TextAttribute } from '@labelu/interface';
import type { AnnotationData, Annotator, ToolName } from '@labelu/image';

import { ReactComponent as MenuOpenIcon } from '@/assets/icons/menu-open.svg';
import { ReactComponent as MenuCloseIcon } from '@/assets/icons/menu-close.svg';
import { useTool } from '@/context/tool.context';
import { useAnnotationCtx } from '@/context/annotation.context';

export const dragModalRef = createRef<DraggableModalRef>();

export interface AttributeModalOpenParams {
  labelValue: string | undefined;
  engine: Annotator | null;
  e?: MouseEvent | React.MouseEvent;
  initialValues?: any;
  labelConfig?: ILabel;

  /** 无论是否有标签属性，都打开编辑弹框 */
  openModalAnyway?: boolean;
}

function generateDefaultAttributes(attributes?: (TextAttribute | EnumerableAttribute)[]) {
  const values: AttributeValue = {};

  attributes?.forEach((item) => {
    const defaultValues = [];

    if ((item as TextAttribute).type === 'string') {
      const stringItem = item as TextAttribute;

      values[stringItem.value] = stringItem.defaultValue || '';
    } else {
      const tagItem = item as EnumerableAttribute;

      if (Array.isArray(tagItem.options)) {
        for (let i = 0; i < tagItem.options.length; i++) {
          if (tagItem.options[i].isDefault) {
            defaultValues.push(tagItem.options[i].value);
          }
        }
      }

      values[tagItem.value] = defaultValues;
    }
  });

  return values;
}

export const openAttributeModal = ({
  engine,
  labelValue,
  e,
  labelConfig,
  openModalAnyway,
}: AttributeModalOpenParams) => {
  const selectedAnnotation = engine?.getSelectedAnnotation();

  if (!dragModalRef.current || !selectedAnnotation || !labelValue || !labelConfig) {
    return;
  }

  // 点击编辑属性时，不管有没有标签属性，都打开编辑框，用来编辑标签
  if (!openModalAnyway && !labelConfig.attributes) {
    return;
  }

  dragModalRef.current.toggleVisibility(true);

  if (e) {
    dragModalRef.current.setPosition({
      x: e.pageX + 10 + 330,
      y: e.pageY + 10,
    });
  } else {
    // 通过快捷键设置属性打开属性编辑框，默认位置为顶部居中
    dragModalRef.current.setPosition({
      x: window.innerWidth / 2 - 330 / 2,
      y: 160,
    });
  }
};

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  border-bottom: 1px rgba(235, 236, 240, 1) solid;
  background-color: #f8f8f8;
  padding: 0 1rem;
  flex-shrink: 0;
`;

const LABEL_GAP = 8;

const MoreTrigger = styled.div`
  white-space: nowrap;
`;

const TriggerWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
`;

const MoreAttribute = styled.div<{ visible: boolean }>`
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
  position: absolute;
  background-color: #fff;
  right: 0;
  display: flex;
  top: 100%;
  z-index: 999;
  padding: 0.5rem;
  box-shadow: 0px 3px 6px 0px rgb(0 0 0 / 21%);
  border-radius: 3px;
  gap: ${LABEL_GAP}px;
`;

const Labels = styled.div`
  position: relative;
  max-width: calc(100vw - 280px);
  display: flex;
  align-items: center;
  gap: ${LABEL_GAP}px;
  height: 100%;
  font-size: 14px;
`;

const LabelWrapper = styled.div<{ color: string; active: boolean }>`
  --attribute-color: ${({ color }) => color};
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  background-color: ${({ active }) => (active ? `var(--attribute-color)` : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#333')};
  border-radius: 2px;
  max-width: 8em;
  text-overflow: ellipsis;
  overflow: hidden;
  box-sizing: border-box;

  &:hover {
    color: ${({ active }) => (active ? '#fff' : 'var(--attribute-color)')};
  }

  &:before {
    position: absolute;
    content: '';
    display: block;
    width: 3px;
    height: 60%;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    background-color: ${({ color }) => color};
  }
`;

function LabelItem({
  children,
  attribute,
  active,
  onSelect,
}: React.PropsWithChildren<{
  attribute: Attribute;
  active: boolean;
  onSelect: (attribute: Attribute, e: React.MouseEvent) => void;
}>) {
  const handleClick = (e: React.MouseEvent) => {
    onSelect(attribute, e);
  };

  return (
    <EllipsisText maxWidth={112} title={children}>
      <LabelWrapper active={active} color={attribute.color ?? '#000'} onClick={handleClick}>
        {children as string}
      </LabelWrapper>
    </EllipsisText>
  );
}

export function LabelSection() {
  const { engine, labels, selectedLabel, onLabelChange, requestEdit, currentTool } = useTool();
  const { selectedAnnotation } = useAnnotationCtx();
  const validationRef = useRef<ValidationContextType | null>(null);
  const labelsWrapperRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const isLabelEditable = useCallback(
    (toolName: ToolName | undefined, label: string | undefined) => {
      return typeof requestEdit === 'function'
        ? requestEdit('edit', {
            toolName: toolName!,
            label,
            modifiedProperty: 'label',
          })
        : true;
    },
    [requestEdit],
  );

  const handleSelect = (label: ILabel, e: React.MouseEvent) => {
    if (!isLabelEditable(currentTool, label.value)) {
      return;
    }

    // 清除上一个标签的属性
    engine?.setAttributes({});
    engine?.setLabel(label.value);

    onLabelChange(label);

    openAttributeModal({
      labelValue: label.value,
      engine,
      e,
      labelConfig: label,
    });
  };

  const handleAttributesChange = useCallback(
    (values: any) => {
      const { attributes, label } = values;

      if (label) {
        // 清除上一个标签的属性
        engine?.setAttributes({});
        engine?.setLabel(label);
      }

      if (attributes) {
        engine?.setAttributes(attributes);
      }
    },
    [engine],
  );

  // 标记完后打开标签属性编辑框
  useEffect(() => {
    const handleAnnotateEnd = (_annotation: AnnotationData, e: MouseEvent) => {
      openAttributeModal({
        labelValue: selectedLabel?.value,
        engine,
        e,
        labelConfig: selectedLabel!,
      });
    };

    engine?.on('add', handleAnnotateEnd);

    return () => {
      engine?.off('add', handleAnnotateEnd);
    };
  }, [engine, selectedLabel]);

  const handleModalClose = async () => {
    if (!dragModalRef.current || !validationRef.current) {
      return;
    }

    try {
      await validationRef.current.submit();
    } catch (error) {
      return Promise.reject(error);
    }

    dragModalRef.current.toggleVisibility(false);
  };

  const [sliceIndex, setSliceIndex] = React.useState(0);
  const [showMore, setShowMore] = React.useState(false);
  const timerRef = useRef<number | undefined>();

  const handleOnMouseOver = () => {
    clearTimeout(timerRef.current);
    setShowMore(true);
  };
  const handleOnMouseOut = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowMore(false);
    }, 1000) as unknown as number;
  };

  useLayoutEffect(() => {
    const processAttributes = () => {
      const maxWidth = window.innerWidth - 280;
      if (!labelsWrapperRef.current) {
        return;
      }

      const labelElements = labelsWrapperRef.current.childNodes;

      let totalWidth = 0;
      let index = 0;

      for (let i = 0; i < labelElements.length; i++) {
        const labelElement = labelElements[i] as HTMLElement;
        totalWidth += labelElement.clientWidth + LABEL_GAP;

        if (totalWidth >= maxWidth) {
          index = i - 1;
          break;
        }
      }

      setSliceIndex(index);
    };

    processAttributes();

    window.addEventListener('resize', processAttributes);

    return () => {
      window.removeEventListener('resize', processAttributes);
    };
  }, [labels]);

  const finalLabels = sliceIndex > 0 ? labels.slice(0, sliceIndex) : labels;
  const extraLabels = sliceIndex > 0 ? labels.slice(sliceIndex) : [];

  const formValue = useMemo(() => {
    return {
      label: selectedLabel?.value,
      attributes: selectedAnnotation?.attributes ?? generateDefaultAttributes(selectedLabel?.attributes),
    };
  }, [selectedAnnotation?.attributes, selectedLabel?.attributes, selectedLabel?.value]);

  const isLabelDisabled = useMemo(() => {
    return !isLabelEditable(currentTool, formValue.label);
  }, [currentTool, formValue.label, isLabelEditable]);

  return (
    <Wrapper>
      <Labels ref={labelsWrapperRef}>
        {finalLabels.map((attribute) => {
          return (
            <LabelItem
              attribute={attribute}
              key={attribute.value}
              onSelect={handleSelect}
              active={selectedLabel?.value === attribute.value}
            >
              {attribute.key}
            </LabelItem>
          );
        })}
        {extraLabels.length > 0 && (
          <MoreTrigger onMouseOver={handleOnMouseOver} onMouseOut={handleOnMouseOut}>
            更多
          </MoreTrigger>
        )}

        <MoreAttribute
          onMouseOver={handleOnMouseOver}
          visible={extraLabels.length > 0 && showMore}
          onMouseOut={handleOnMouseOut}
        >
          {extraLabels.map((attribute) => (
            <LabelItem
              attribute={attribute}
              key={attribute.value}
              onSelect={handleSelect}
              active={selectedLabel?.value === attribute.value}
            >
              {attribute.key}
            </LabelItem>
          ))}
        </MoreAttribute>
      </Labels>
      <TriggerWrapper
        onClick={() => {
          setCollapsed((pre) => {
            document.dispatchEvent(
              new CustomEvent('attribute-collapse', {
                detail: {
                  collapsed: !pre,
                },
              }),
            );
            return !pre;
          });
        }}
      >
        {collapsed && <MenuOpenIcon />}
        {!collapsed && <MenuCloseIcon />}
      </TriggerWrapper>
      <DraggableModel
        beforeClose={handleModalClose}
        title="详细信息"
        ref={dragModalRef}
        width={333}
        okText="确认"
        cancelText="取消"
      >
        <AttributeForm
          ref={validationRef}
          onAttributeChange={handleAttributesChange}
          onLabelChange={(label) => {
            // 清除上一个标签的属性
            engine?.setAttributes({});
            engine?.setLabel(label.value);
          }}
          attributes={labels}
          labelDisabled={isLabelDisabled}
          initialValues={formValue}
          currentAttribute={selectedLabel}
        />
      </DraggableModel>
    </Wrapper>
  );
}
