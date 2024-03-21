import React, { createRef, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type { DraggableModalRef, ValidationContextType } from '@labelu/components-react';
import { DraggableModel, AttributeForm, EllipsisText } from '@labelu/components-react';
import type { Attribute } from '@labelu/interface';

import { ReactComponent as MenuOpenIcon } from '@/assets/icons/menu-open.svg';
import { ReactComponent as MenuCloseIcon } from '@/assets/icons/menu-close.svg';
import { useTool } from '@/context/tool.context';
import { useAnnotationCtx } from '@/context/annotation.context';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
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

export interface AttributeModalOpenParams {
  labelValue: string | undefined;
  e?: MouseEvent | React.MouseEvent;
  labelConfig?: Attribute;

  /** 无论是否有标签属性，都打开编辑弹框 */
  openModalAnyway?: boolean;
}

export const dragModalRef = createRef<DraggableModalRef>();

export const openAttributeModal = ({ labelValue, e, labelConfig, openModalAnyway }: AttributeModalOpenParams) => {
  if (!dragModalRef.current || !labelValue || !labelConfig) {
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
  const { selectedLabel, player, onLabelChange, labels, onAttributeChange } = useTool();
  const { selectedAnnotation } = useAnnotationCtx();
  const validationRef = useRef<ValidationContextType | null>(null);
  const labelsWrapperRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleSelect = (attribute: Attribute, e: React.MouseEvent) => {
    onLabelChange(attribute);

    player.pause();

    openAttributeModal({
      labelValue: attribute.value,
      labelConfig: attribute,
      e,
    });
  };

  const handleModalClose = async () => {
    if (!dragModalRef.current || !validationRef.current) {
      return;
    }

    try {
      await validationRef.current.submit();
    } catch (error) {
      return Promise.reject(error);
    }

    // 关闭属性编辑框后继续播放
    player.play();

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

  const finalAttributes = sliceIndex > 0 ? labels.slice(0, sliceIndex) : labels;
  const extraAttributes = sliceIndex > 0 ? labels.slice(sliceIndex) : [];

  return (
    <Wrapper>
      <Labels ref={labelsWrapperRef}>
        {finalAttributes.map((attribute) => {
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
        {extraAttributes.length > 0 && (
          <MoreTrigger onMouseOver={handleOnMouseOver} onMouseOut={handleOnMouseOut}>
            更多
          </MoreTrigger>
        )}

        <MoreAttribute
          onMouseOver={handleOnMouseOver}
          visible={extraAttributes.length > 0 && showMore}
          onMouseOut={handleOnMouseOut}
        >
          {extraAttributes.map((attribute) => (
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
          document.dispatchEvent(new CustomEvent('attribute-collapse'));
          setCollapsed((pre) => !pre);
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
          onAttributeChange={onAttributeChange}
          onLabelChange={onLabelChange}
          attributes={labels}
          initialValues={selectedAnnotation}
          currentAttribute={selectedLabel}
        />
      </DraggableModel>
    </Wrapper>
  );
}
