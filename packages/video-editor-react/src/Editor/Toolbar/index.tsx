import { useContext } from 'react';
import { Toolbar, Tooltip, Kbd, HotkeyPanel } from '@label-u/components-react';
import { useHotkeys } from 'react-hotkeys-hook';
import type { VideoAnnotationType } from '@label-u/interface';

import { ReactComponent as SegmentIcon } from '@/assets/icons/segment.svg';
import { ReactComponent as FrameIcon } from '@/assets/icons/frame.svg';
import { ReactComponent as CursorIcon } from '@/assets/icons/cursor.svg';

import EditorContext from '../context';
import hotkeysConst from './hotkeys.const';

export interface IToolbarInEditorProps {
  extra?: React.ReactNode;
  right?: React.ReactNode;
}

const tooltipStyle = {
  '--arrow-color': '#fff',
  '--tooltip-color': '#000',
  '--tooltip-bg': '#fff',
} as React.CSSProperties;

export default function ToolbarInEditor({ right }: IToolbarInEditorProps) {
  const { onToolChange, currentTool, onOrderVisibleChange, config, orderVisible, redo, undo, pastRef, futureRef } =
    useContext(EditorContext);

  const handleToolChange = (tool?: VideoAnnotationType) => () => {
    onToolChange(tool);
  };

  useHotkeys('ctrl+z, meta+z', undo, [undo]);
  useHotkeys('ctrl+shift+z, meta+shift+z', redo, [undo]);
  // 恢复指针
  useHotkeys(
    'c',
    () => {
      onToolChange();
    },
    {
      preventDefault: true,
    },
    [onToolChange],
  );

  // 切换片断分割
  useHotkeys(
    'x',
    () => {
      onToolChange('segment');
    },
    {
      preventDefault: true,
      enabled: currentTool !== 'segment',
    },
    [currentTool, onToolChange],
  );

  // 切换时间戳
  useHotkeys(
    'e',
    () => {
      onToolChange('frame');
    },
    {
      preventDefault: true,
      enabled: currentTool !== 'frame',
    },
    [currentTool, onToolChange],
  );

  return (
    <Toolbar
      disableRedo={!futureRef.current?.length}
      disableUndo={!!pastRef.current && pastRef.current.length <= 1}
      onOrderSwitch={onOrderVisibleChange}
      showOrder={orderVisible}
      onRedo={redo}
      onUndo={undo}
      tools={
        <>
          <Tooltip
            overlay={
              <span>
                恢复 <Kbd dark>C</Kbd>
              </span>
            }
            placement="topLeft"
          >
            <Toolbar.Item active={!currentTool} onClick={handleToolChange()}>
              <CursorIcon />
            </Toolbar.Item>
          </Tooltip>
          {config?.segment && (
            <Tooltip
              overlay={
                <span>
                  片断分割 <Kbd dark>X</Kbd>
                </span>
              }
              placement="top"
            >
              <Toolbar.Item active={currentTool === 'segment'} onClick={handleToolChange('segment')}>
                <SegmentIcon />
              </Toolbar.Item>
            </Tooltip>
          )}
          {config?.frame && (
            <Tooltip
              overlay={
                <span>
                  时间戳 <Kbd dark>E</Kbd>
                </span>
              }
              placement="top"
            >
              <Toolbar.Item active={currentTool === 'frame'} onClick={handleToolChange('frame')}>
                <FrameIcon />
              </Toolbar.Item>
            </Tooltip>
          )}
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
