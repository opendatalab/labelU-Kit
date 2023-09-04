import { useContext } from 'react';
import { Toolbar } from '@label-u/components-react';
import { useHotkeys } from 'react-hotkeys-hook';
import type { VideoAnnotationType } from '@label-u/interface';

import { ReactComponent as SegmentIcon } from '@/assets/icons/segment.svg';
import { ReactComponent as FrameIcon } from '@/assets/icons/frame.svg';
import { ReactComponent as CursorIcon } from '@/assets/icons/cursor.svg';

import EditorContext from '../context';

export interface IToolbarInEditorProps {
  extra?: React.ReactNode;
  right?: React.ReactNode;
}

export default function ToolbarInEditor({ extra, right }: IToolbarInEditorProps) {
  const { onToolChange, currentTool, onOrderVisibleChange, config, orderVisible, redo, undo, pastRef, futureRef } =
    useContext(EditorContext);

  const handleToolChange = (tool?: VideoAnnotationType) => () => {
    onToolChange(tool);
  };

  useHotkeys('ctrl+z, meta+z', undo, []);
  useHotkeys('ctrl+shift+z, meta+shift+z', redo, []);

  return (
    <Toolbar
      disableRedo={!futureRef.current?.length}
      disableUndo={!pastRef.current?.length}
      onOrderSwitch={onOrderVisibleChange}
      showOrder={orderVisible}
      onRedo={redo}
      onUndo={undo}
      tools={
        <>
          <Toolbar.Item active={!currentTool} onClick={handleToolChange()}>
            <CursorIcon />
          </Toolbar.Item>
          {config?.segment && (
            <Toolbar.Item active={currentTool === 'segment'} onClick={handleToolChange('segment')}>
              <SegmentIcon />
            </Toolbar.Item>
          )}
          {config?.frame && (
            <Toolbar.Item active={currentTool === 'frame'} onClick={handleToolChange('frame')}>
              <FrameIcon />
            </Toolbar.Item>
          )}
        </>
      }
      extra={extra}
      right={right}
    />
  );
}
