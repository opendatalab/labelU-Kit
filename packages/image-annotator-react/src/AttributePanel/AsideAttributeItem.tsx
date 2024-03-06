import styled, { css } from 'styled-components';
import { useMemo } from 'react';
import { EllipsisText } from '@labelu/components-react';
import type { AnnotationData, ToolName } from '@labelu/image';

import { ReactComponent as EditIcon } from '@/assets/icons/edit.svg';
import { ReactComponent as DeleteIcon } from '@/assets/icons/delete.svg';
import { ReactComponent as VisibilityIcon } from '@/assets/icons/visibility.svg';
import { ReactComponent as VisibilityOffIcon } from '@/assets/icons/visibility-off.svg';
// tool icons
import { ReactComponent as PointToolIcon } from '@/assets/tools/point.svg';
import { ReactComponent as LineToolIcon } from '@/assets/tools/line.svg';
import { ReactComponent as RectToolIcon } from '@/assets/tools/rect.svg';
import { ReactComponent as PolygonToolIcon } from '@/assets/tools/polygon.svg';
import { ReactComponent as CuboidToolIcon } from '@/assets/tools/cuboid.svg';
import { ReactComponent as UnknownIcon } from '@/assets/tools/unknown.svg';
import { openAttributeModal } from '@/LabelSection';
import type { AnnotationDataInUI } from '@/context/annotation.context';
import { useAnnotationCtx } from '@/context/annotation.context';
import { useTool } from '@/context/tool.context';

const ToolIconMapping: Record<
  ToolName,
  React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
    }
  >
> = {
  point: PointToolIcon,
  line: LineToolIcon,
  rect: RectToolIcon,
  polygon: PolygonToolIcon,
  cuboid: CuboidToolIcon,
};

interface AttributeItemProps {
  annotation: AnnotationDataInUI;
  order: number;
  labelText: string;
  color: string;
  active?: boolean;
}

export const Action = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 1.125rem;
  color: #999;

  svg {
    opacity: 0;
    cursor: pointer;

    &:hover {
      color: var(--color-primary);
    }

    &:last-child {
      &:hover {
        color: red;
      }
    }
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover svg {
    opacity: 1;
  }
`;

const InnerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    font-size: 1.25rem;
    flex-shrink: 0;
  }
`;

// @ts-ignore
const StyledVisibilityOffIcon = styled(VisibilityOffIcon)`
  opacity: 1 !important;
`;

const AsideAttributeWrapper = styled.div<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 1rem 0.5rem 2rem;
  cursor: pointer;

  &:hover svg {
    opacity: 1;
  }

  &:hover ${InnerHeader} {
    ${({ color }) => css`
      color: ${color};
    `}
  }

  &:last-child {
    margin-bottom: 0;
  }

  ${({ active }) =>
    active &&
    css`
      background-color: #f5f5f5;
    `}
`;

export interface AttributeActionProps {
  annotation?: AnnotationDataInUI;
  annotations?: AnnotationDataInUI[];
  showEdit?: boolean;
}

export function AttributeAction({ annotation, annotations, showEdit = true }: AttributeActionProps) {
  const { engine, requestEdit, labelMapping, currentTool } = useTool();
  const { onImageAnnotationChange, onImageAnnotationsChange } = useAnnotationCtx();

  const annotationsMapping = useMemo(() => {
    if (!annotations) {
      return {};
    }

    return annotations.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, AnnotationData>);
  }, [annotations]);

  const visible = useMemo(() => {
    if (annotation) {
      return typeof annotation.visible === 'undefined' ? true : Boolean(annotation.visible);
    }

    if (annotations) {
      return annotations.every((item) => (typeof item.visible === 'undefined' ? true : item.visible));
    }

    return true;
  }, [annotation, annotations]);

  const handleEditClick = (e: React.MouseEvent) => {
    engine.selectAnnotation(annotation!.tool, annotation!.id);

    if (!annotation?.label) {
      return;
    }

    const editable =
      typeof requestEdit === 'function'
        ? requestEdit('edit', {
            label: annotation!.label,
            toolName: annotation!.tool,
          })
        : true;

    if (!editable) {
      return;
    }

    const currentLabelConfig = labelMapping[annotation.tool][annotation.label];
    const defaultLabelConfig = Object.values(labelMapping[annotation.tool])[0];

    // 如果预标注的标签不在用户配置中，打开编辑框时默认选中用户配置的第一个标签
    if (currentTool === annotation!.tool && !currentLabelConfig) {
      engine.setLabel(defaultLabelConfig.value);
    }

    // 等selectedAnnotation状态更新了再打开，因为Form里的值是从selectedAnnotation里取的
    setTimeout(() => {
      openAttributeModal({
        labelValue: annotation!.label,
        engine,
        e,
        openModalAnyway: true,
        labelConfig: currentLabelConfig || defaultLabelConfig,
      });
    });
  };

  const toggleOneVisibility = (value: boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!annotation) {
      return;
    }

    engine?.toggleAnnotationsVisibility(annotation.tool, [annotation.id], value);

    onImageAnnotationChange({ ...annotation, visible: value });
  };

  const toggleBatchVisibility = (value: boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!annotations) {
      return;
    }

    const toolIds: Record<ToolName, string[]> = {} as Record<ToolName, string[]>;

    annotations.forEach((item) => {
      if (!toolIds[item.tool]) {
        toolIds[item.tool] = [];
      }

      toolIds[item.tool].push(item.id);
    });

    Object.keys(toolIds).forEach((tool) => {
      engine?.toggleAnnotationsVisibility(tool as ToolName, toolIds[tool as ToolName], value);
    });

    onImageAnnotationsChange(
      annotations.map((item) => {
        if (annotationsMapping[item.id]) {
          return { ...item, visible: value };
        }

        return item;
      }),
    );
  };

  // 单个标注
  if (annotation) {
    return (
      <Action>
        {showEdit && <EditIcon onClick={handleEditClick} />}
        {visible && <VisibilityIcon onClick={toggleOneVisibility(false)} />}
        {!visible && <StyledVisibilityOffIcon onClick={toggleOneVisibility(true)} />}
        <DeleteIcon onClick={() => engine?.removeAnnotationById(annotation.tool, annotation.id)} />
      </Action>
    );
  }

  // 一组标注
  return (
    <Action>
      {showEdit && <EditIcon onClick={handleEditClick} />}
      {visible && <VisibilityIcon onClick={toggleBatchVisibility(false)} />}
      {!visible && <StyledVisibilityOffIcon onClick={toggleBatchVisibility(true)} />}
      <DeleteIcon
        onClick={() => {
          annotations?.forEach((item) => {
            engine?.removeAnnotationById(item.tool, item.id);
          });
        }}
      />
    </Action>
  );
}

export default function AsideAttributeItem({ annotation, active, order, labelText, color }: AttributeItemProps) {
  const { engine } = useTool();
  const ToolIcon = ToolIconMapping[annotation.tool as ToolName] ?? UnknownIcon;

  return (
    <AsideAttributeWrapper
      color={color}
      active={active}
      onClick={() => {
        engine?.selectAnnotation(annotation.tool, annotation.id);
      }}
    >
      <Header>
        <InnerHeader>
          <div>{order}.</div>
          <ToolIcon color={color} />
          <EllipsisText maxWidth={112} title={labelText}>
            <div>{labelText}</div>
          </EllipsisText>
        </InnerHeader>
        <AttributeAction annotation={annotation} />
      </Header>
    </AsideAttributeWrapper>
  );
}
