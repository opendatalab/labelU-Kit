import { Toolbar, Tooltip, Kbd, HotkeyPanel } from '@labelu/components-react';
import { useHotkeys } from 'react-hotkeys-hook';
import type { VideoAnnotationType } from '@labelu/interface';
import styled from 'styled-components';
import { useTranslation } from '@labelu/i18n';

import { ReactComponent as SegmentIcon } from '@/assets/icons/segment.svg';
import { ReactComponent as FrameIcon } from '@/assets/icons/frame.svg';
import { ReactComponent as CursorIcon } from '@/assets/icons/cursor.svg';
import { useTool } from '@/context/tool.context';
import { useAnnotationCtx } from '@/context/annotation.context';
import { useHistoryCtx } from '@/context/history.context';

import hotkeysConst from './hotkeys.const';

const ToolbarWrapper = styled(Toolbar)`
  color: rgba(0, 0, 0, 0.6);
`;

export interface IToolbarInEditorProps {
  extra?: React.ReactNode;
  right?: React.ReactNode;
}

export const tooltipStyle = {
  '--arrow-color': '#fff',
  '--tooltip-color': '#000',
  '--tooltip-bg': '#fff',
} as React.CSSProperties;

export function AnnotatorToolbar({ right }: IToolbarInEditorProps) {
  const { onToolChange, currentTool, config, attributeModalOpen } = useTool();
  const { onOrderVisibleChange, orderVisible, disabled } = useAnnotationCtx();
  const { redo, undo, pastRef, futureRef } = useHistoryCtx();
  // @ts-ignore
  const { t } = useTranslation();

  const handleToolChange = (tool?: VideoAnnotationType) => () => {
    if (disabled) {
      return;
    }

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
      enabled: !attributeModalOpen,
    },
    [onToolChange, attributeModalOpen],
  );

  // 切换片断分割
  useHotkeys(
    'x',
    () => {
      if (config?.segment) {
        onToolChange('segment');
      }
    },
    {
      preventDefault: true,
      enabled: !attributeModalOpen && !disabled && currentTool !== 'segment',
    },
    [currentTool, onToolChange, config?.segment, disabled, attributeModalOpen],
  );

  // 切换时间戳
  useHotkeys(
    'e',
    () => {
      if (config?.frame) {
        onToolChange('frame');
      }
    },
    {
      preventDefault: true,
      enabled: !attributeModalOpen && !disabled && currentTool !== 'frame',
    },
    [currentTool, onToolChange, config?.frame, disabled, attributeModalOpen],
  );

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
          <Tooltip
            overlay={
              <span>
                {t('select')} <Kbd dark>C</Kbd>
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
                  {t('segment')} <Kbd dark>X</Kbd>
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
                  {t('timestamp')} <Kbd dark>E</Kbd>
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
          <Toolbar.Item>{t('hotkeys')}</Toolbar.Item>
        </Tooltip>
      }
      right={right}
    />
  );
}
