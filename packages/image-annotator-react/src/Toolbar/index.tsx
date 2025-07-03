import { Toolbar, Tooltip, HotkeyPanel } from '@labelu/components-react';
import { useHotkeys } from 'react-hotkeys-hook';
import styled from 'styled-components';
import { useTranslation } from '@labelu/i18n';
import type { ToolName } from '@labelu/image';
import { useCallback, useMemo } from 'react';

import { ReactComponent as PointIcon } from '@/assets/tools/point.svg';
import { ReactComponent as LineIcon } from '@/assets/tools/line.svg';
import { ReactComponent as RectIcon } from '@/assets/tools/rect.svg';
import { ReactComponent as PolygonIcon } from '@/assets/tools/polygon.svg';
import { ReactComponent as CuboidIcon } from '@/assets/tools/cuboid.svg';
import { ReactComponent as RelationIcon } from '@/assets/tools/relation.svg';
import { useTool } from '@/context/tool.context';
import { useAnnotationCtx } from '@/context/annotation.context';
import { useHistoryCtx } from '@/context/history.context';
import { dragModalRef } from '@/LabelSection';

import ToolStyle from './ToolStyle';
import hotkeysConst from './hotkeys.const';

const ToolbarWrapper = styled(Toolbar)`
  color: rgba(0, 0, 0, 0.6);
`;

const iconMapping = {
  point: <PointIcon />,
  line: <LineIcon />,
  rect: <RectIcon />,
  polygon: <PolygonIcon />,
  cuboid: <CuboidIcon />,
  relation: <RelationIcon />,
};

export interface IToolbarInEditorProps {
  extra?: React.ReactNode;
  right?: React.ReactNode;
}

export const tooltipStyle = {
  '--arrow-color': '#fff',
  '--tooltip-color': '#000',
  '--tooltip-bg': '#fff',
} as React.CSSProperties;

const ToolStyleWrapper = styled.div`
  margin: 0 0.5rem;
  cursor: pointer;
  color: #333;
`;

export function AnnotatorToolbar({ right }: IToolbarInEditorProps) {
  const { engine, currentTool, tools, memorizeToolLabel } = useTool();
  const { onOrderVisibleChange, orderVisible } = useAnnotationCtx();
  const { redo, undo, futureRef, pastRef } = useHistoryCtx();
  // @ts-ignore
  const { t } = useTranslation();

  const toolNameTextMapping = useMemo(
    () => ({
      point: t('point'),
      line: t('line'),
      rect: t('rect'),
      polygon: t('polygon'),
      cuboid: t('cuboid'),
      relation: t('relation'),
    }),
    [t],
  );

  const handleUndo = useCallback(() => {
    if (dragModalRef.current?.getVisibility()) {
      return;
    }

    undo();
  }, [undo]);

  const handleToolChange = (tool: ToolName) => () => {
    engine.switch(tool, memorizeToolLabel.current?.[tool]?.value);
  };

  useHotkeys('ctrl+z, meta+z', handleUndo, [handleUndo]);
  useHotkeys('ctrl+shift+z, meta+shift+z', redo, [undo]);

  return (
    <ToolbarWrapper
      disableRedo={!futureRef.current?.length}
      disableUndo={!!pastRef.current && pastRef.current.length <= 1}
      onOrderSwitch={onOrderVisibleChange}
      showOrder={orderVisible}
      onRedo={redo}
      onUndo={undo}
      tools={
        <>
          {tools.map((tool) => {
            return (
              <Tooltip key={tool} overlay={<span>{toolNameTextMapping[tool]}</span>} placement="topLeft">
                <Toolbar.Item active={currentTool === tool} onClick={handleToolChange(tool)}>
                  {iconMapping[tool]}
                </Toolbar.Item>
              </Tooltip>
            );
          })}
          <Tooltip overlayStyle={tooltipStyle} overlay={<ToolStyle />} placement="bottomLeft">
            <ToolStyleWrapper>{t('toolStyle')}</ToolStyleWrapper>
          </Tooltip>
        </>
      }
      extra={
        <Tooltip overlayStyle={tooltipStyle} overlay={<HotkeyPanel items={hotkeysConst} />} placement="bottomLeft">
          <Toolbar.Item>{t('hotkeys')}</Toolbar.Item>
        </Tooltip>
      }
      right={right}
    />
  );
}
