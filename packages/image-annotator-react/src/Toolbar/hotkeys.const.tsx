import { Kbd, getOS } from '@labelu/components-react';
import { i18n } from '@labelu/i18n';

import { ReactComponent as MouseRightClick } from './assets/mouse-right.svg';
import { ReactComponent as MouseLeftClick } from './assets/mouse-left.svg';
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
        name: i18n.t('prevImage'),
        content: <Kbd>A</Kbd>,
      },
      {
        name: i18n.t('nextImage'),
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
        name: i18n.t('rotate'),
        content: <Kbd>R</Kbd>,
      },
      {
        name: i18n.t('moveCanvas'),
        content: (
          <>
            {i18n.t('longPress')}
            <MouseRightClick />
          </>
        ),
      },
      {
        name: i18n.t('selectLabel'),
        content: <MouseRightClick />,
      },
      {
        name: i18n.t('deleteLabel'),
        content: (
          <>
            {i18n.t('selectLabelAndPress')} <Kbd>Del</Kbd> {i18n.t('or')} <Kbd>Backspace</Kbd>
          </>
        ),
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
        name: i18n.t('prevLabel'),
        content: <Kbd>↑</Kbd>,
      },
      {
        name: i18n.t('nextLabel'),
        content: <Kbd>↓</Kbd>,
      },
      {
        name: i18n.t('cancel'),
        content: <Kbd>Esc</Kbd>,
      },
    ],
  },
  {
    label: i18n.t('tools'),
    key: 'tools',
    children: [
      {
        label: i18n.t('plainPoint'),
        key: 'point',
        hotkeys: [
          {
            name: i18n.t('point'),
            content: <MouseLeftClick />,
          },
          {
            name: i18n.t('movePoint'),
            content: (
              <>
                {i18n.t('selectPointAndLongPress')} <MouseLeftClick /> {i18n.t('dragPoint')}
              </>
            ),
          },
        ],
      },
      {
        label: i18n.t('plainLine'),
        key: 'line',
        hotkeys: [
          {
            name: i18n.t('line'),
            content: <MouseLeftClick />,
          },
          {
            name: i18n.t('shiftLine'),
            content: (
              <>
                <Kbd>Shift</Kbd> + <MouseLeftClick />
              </>
            ),
          },
          {
            name: i18n.t('movePoint'),
            content: (
              <>
                {i18n.t('selectPointAndLongPress')} <MouseLeftClick /> {i18n.t('dragPoint')}
              </>
            ),
          },
          {
            name: i18n.t('insertPoint'),
            content: (
              <>
                {i18n.t('edgePress')} <Kbd>Alt</Kbd>, {i18n.t('thenClick')} <MouseLeftClick />
              </>
            ),
          },
          {
            name: i18n.t('deletePoint'),
            content: (
              <>
                {i18n.t('pointPress')} <Kbd>Alt</Kbd>, {i18n.t('thenClick')} <MouseLeftClick />
              </>
            ),
          },
        ],
      },
      {
        label: i18n.t('plainRect'),
        key: 'rect',
        hotkeys: [
          {
            name: i18n.t('rect'),
            content: <MouseLeftClick />,
          },
          {
            name: i18n.t('moveEdge'),
            content: (
              <>
                {i18n.t('selectEdgeAndLongPress')} <MouseLeftClick /> {i18n.t('dragEdge')}
              </>
            ),
          },
          {
            name: i18n.t('movePoint'),
            content: (
              <>
                {i18n.t('selectPointAndLongPress')} <MouseLeftClick /> {i18n.t('dragPoint')}
              </>
            ),
          },
          {
            name: i18n.t('cancel'),
            content: <Kbd>Esc</Kbd>,
          },
        ],
      },
      {
        label: i18n.t('plainPolygon'),
        key: 'polygon',
        hotkeys: [
          {
            name: i18n.t('polygon'),
            content: <MouseLeftClick />,
          },
          {
            name: i18n.t('moveEdge'),
            content: (
              <>
                {i18n.t('selectEdgeAndLongPress')} <MouseLeftClick /> {i18n.t('dragEdge')}
              </>
            ),
          },
          {
            name: i18n.t('movePoint'),
            content: (
              <>
                {i18n.t('selectPointAndLongPress')} <MouseLeftClick /> {i18n.t('dragPoint')}
              </>
            ),
          },
          {
            name: i18n.t('insertPoint'),
            content: (
              <>
                {i18n.t('pointPress')} <Kbd>Alt</Kbd>, {i18n.t('thenClick')} <MouseLeftClick />
              </>
            ),
          },
          {
            name: i18n.t('deletePoint'),
            content: (
              <>
                {i18n.t('pointPress')} <Kbd>Alt</Kbd>, {i18n.t('thenClick')} <MouseLeftClick />
              </>
            ),
          },
          {
            name: i18n.t('cropOverlap'),
            content: (
              <>
                <Kbd>Alt</Kbd> + <Kbd>X</Kbd>
              </>
            ),
          },
          {
            name: i18n.t('cancel'),
            content: <Kbd>Esc</Kbd>,
          },
        ],
      },
      {
        label: i18n.t('cuboid'),
        key: 'cuboid',
        hotkeys: [
          {
            name: i18n.t('makeCuboid'),
            content: <MouseLeftClick />,
          },
          {
            name: i18n.t('moveEdge'),
            content: (
              <>
                {i18n.t('selectEdgeAndLongPress')} <MouseLeftClick /> {i18n.t('dragEdge')}
              </>
            ),
          },
          {
            name: i18n.t('movePoint'),
            content: (
              <>
                {i18n.t('selectPointAndLongPress')} <MouseLeftClick /> {i18n.t('dragPoint')}
              </>
            ),
          },
          {
            name: i18n.t('cancel'),
            content: <Kbd>Esc</Kbd>,
          },
        ],
      },
    ],
  },
];
