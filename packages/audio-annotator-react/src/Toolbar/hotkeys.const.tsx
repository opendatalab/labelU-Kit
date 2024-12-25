import { Kbd, getOS } from '@labelu/components-react';
import { i18n } from '@labelu/i18n';

import { ReactComponent as MouseRightClick } from './mouse-right.svg';
const os = getOS();

export default [
  {
    label: i18n.t('general'),
    key: 'common',
    hotkeys: [
      {
        name: i18n.t('save'),
        content:
          os === 'MacOS' ? (
            <>
              <Kbd>⌘</Kbd> + <Kbd>S</Kbd>
            </>
          ) : (
            <>
              <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd>
            </>
          ),
      },
      {
        name: i18n.t('skip'),
        content:
          os === 'MacOS' ? (
            <>
              <Kbd>⌘</Kbd> + <Kbd>Space</Kbd>
            </>
          ) : (
            <>
              <Kbd>Ctrl</Kbd> + <Kbd>Space</Kbd>
            </>
          ),
      },
      {
        name: i18n.t('undo'),
        content:
          os === 'MacOS' ? (
            <>
              <Kbd>⌘</Kbd> + <Kbd>Z</Kbd>
            </>
          ) : (
            <>
              <Kbd>Ctrl</Kbd> + <Kbd>Z</Kbd>
            </>
          ),
      },
      {
        name: i18n.t('redo'),
        content:
          os === 'MacOS' ? (
            <>
              <Kbd>⌘</Kbd> + <Kbd>⇧</Kbd> + <Kbd>Z</Kbd>
            </>
          ) : (
            <>
              <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>Z</Kbd>
            </>
          ),
      },
      {
        name: i18n.t('previous'),
        content: <Kbd>A</Kbd>,
      },
      {
        name: i18n.t('next'),
        content: <Kbd>D</Kbd>,
      },
      {
        name: i18n.t('select9'),
        content: (
          <>
            <Kbd>1</Kbd> ~ <Kbd>9</Kbd>
          </>
        ),
      },
    ],
  },
  {
    label: i18n.t('basicAction'),
    key: 'actions',
    hotkeys: [
      {
        name: `${i18n.t('play')} / ${i18n.t('pause')}`,
        content: <Kbd>Space</Kbd>,
      },
      {
        name: i18n.t('editAttribute'),
        content: (
          <>
            {os === 'MacOS' ? <Kbd>⇧</Kbd> : <Kbd>Shift</Kbd>} + <MouseRightClick />
          </>
        ),
      },
      {
        name: i18n.t('increaseRate'),
        content:
          os === 'MacOS' ? (
            <>
              <Kbd>⌘</Kbd> + <Kbd>→</Kbd>
            </>
          ) : (
            <>
              <Kbd>Ctrl</Kbd> + <Kbd>→</Kbd>
            </>
          ),
      },
      {
        name: i18n.t('decreaseRate'),
        content:
          os === 'MacOS' ? (
            <>
              <Kbd>⌘</Kbd> + <Kbd>←</Kbd>
            </>
          ) : (
            <>
              <Kbd>Ctrl</Kbd> + <Kbd>←</Kbd>
            </>
          ),
      },
      {
        name: i18n.t('forward'),
        content: <Kbd>→</Kbd>,
      },
      {
        name: i18n.t('backward'),
        content: <Kbd>←</Kbd>,
      },
      {
        name: i18n.t('selectLabel'),
        content: <MouseRightClick />,
      },
      {
        name: i18n.t('deleteLabel'),
        content: (
          <>
            {i18n.t('selectThenPress')} <Kbd>Delete</Kbd> {i18n.t('or')} <Kbd>Backspace</Kbd>
          </>
        ),
      },
      {
        name: i18n.t('prevLabel'),
        content: <Kbd>↑</Kbd>,
      },
      {
        name: i18n.t('nextLabel'),
        content: <Kbd>↓</Kbd>,
      },
    ],
  },
  {
    label: i18n.t('tools'),
    key: 'tools',
    children: [
      {
        label: i18n.t('segment'),
        key: 'segment',
        hotkeys: [
          {
            name: i18n.t('doSegment'),
            content: (
              <span>
                {i18n.t('pressAtStartAndEnd')} <Kbd>X</Kbd>
              </span>
            ),
          },
          {
            name: i18n.t('cancel'),
            content: <Kbd>Esc</Kbd>,
          },
        ],
      },
      {
        label: i18n.t('timestamp'),
        key: 'frame',
        hotkeys: [
          {
            name: i18n.t('doTimestamp'),
            content: <Kbd>E</Kbd>,
          },
        ],
      },
    ],
  },
];
