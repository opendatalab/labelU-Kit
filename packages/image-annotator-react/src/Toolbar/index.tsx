import { Toolbar, Tooltip, HotkeyPanel } from '@labelu/components-react';
import { useHotkeys } from 'react-hotkeys-hook';
import styled from 'styled-components';
import type { ToolName } from '@labelu/image';

import { ReactComponent as PointIcon } from '@/assets/tools/point.svg';
import { ReactComponent as LineIcon } from '@/assets/tools/line.svg';
import { ReactComponent as RectIcon } from '@/assets/tools/rect.svg';
import { ReactComponent as PolygonIcon } from '@/assets/tools/polygon.svg';
import { ReactComponent as CuboidIcon } from '@/assets/tools/cuboid.svg';
import { useTool } from '@/context/tool.context';
import { useAnnotationCtx } from '@/context/annotation.context';
import { useHistoryCtx } from '@/context/history.context';

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
};

const toolNameTextMapping = {
  point: '标点',
  line: '标线',
  rect: '拉框',
  polygon: '多边形',
  cuboid: '立体框',
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
  const { engine, currentTool, tools } = useTool();
  const { onOrderVisibleChange, orderVisible } = useAnnotationCtx();
  const { redo, undo, futureRef, pastRef } = useHistoryCtx();

  const handleToolChange = (tool: ToolName) => () => {
    engine.switch(tool);
  };

  useHotkeys('ctrl+z, meta+z', undo, [undo]);
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
            <ToolStyleWrapper>工具样式</ToolStyleWrapper>
          </Tooltip>
        </>
      }
      extra={
        <Tooltip overlayStyle={tooltipStyle} overlay={<HotkeyPanel items={hotkeysConst} />} placement="bottomLeft">
          <Toolbar.Item>快捷键</Toolbar.Item>
        </Tooltip>
      }
      right={right}
    />
  );
}
