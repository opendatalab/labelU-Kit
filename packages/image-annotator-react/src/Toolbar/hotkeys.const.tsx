import { Kbd, getOS } from '@labelu/components-react';

import { ReactComponent as MouseRightClick } from './assets/mouse-right.svg';
import { ReactComponent as MouseLeftClick } from './assets/mouse-left.svg';
const os = getOS();

export default [
  {
    label: '通用',
    key: 'common',
    hotkeys: [
      {
        name: '保存',
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
        name: '跳过',
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
        name: '撤销',
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
        name: '重做',
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
        name: '上一张',
        content: <Kbd>A</Kbd>,
      },
      {
        name: '下一张',
        content: <Kbd>D</Kbd>,
      },
      {
        name: '选择前9个标签',
        content: (
          <>
            <Kbd>1</Kbd> ~ <Kbd>9</Kbd>
          </>
        ),
      },
    ],
  },
  {
    label: '基础操作',
    key: 'actions',
    hotkeys: [
      {
        name: '旋转',
        content: <Kbd>R</Kbd>,
      },
      {
        name: '移动画布',
        content: (
          <>
            长按
            <MouseRightClick />
          </>
        ),
      },
      {
        name: '选中标记',
        content: <MouseRightClick />,
      },
      {
        name: '删除标记',
        content: (
          <>
            选中标记，按 <Kbd>Del</Kbd> 或 <Kbd>Backspace</Kbd>
          </>
        ),
      },
      {
        name: '上一个标记',
        content: <Kbd>↑</Kbd>,
      },
      {
        name: '下一个标记',
        content: <Kbd>↓</Kbd>,
      },
      {
        name: '取消',
        content: <Kbd>Esc</Kbd>,
      },
    ],
  },
  {
    label: '标注工具',
    key: 'tools',
    children: [
      {
        label: '点',
        key: 'point',
        hotkeys: [
          {
            name: '标点',
            content: <MouseLeftClick />,
          },
          {
            name: '移动点',
            content: (
              <>
                选中点，长按 <MouseLeftClick /> 拖拽点
              </>
            ),
          },
        ],
      },
      {
        label: '线',
        key: 'line',
        hotkeys: [
          {
            name: '标线',
            content: <MouseLeftClick />,
          },
          {
            name: '标水平 / 垂直线',
            content: (
              <>
                <Kbd>Shift</Kbd> + <MouseLeftClick />
              </>
            ),
          },
          {
            name: '移动点',
            content: (
              <>
                选中点，长按 <MouseLeftClick /> 拖拽点
              </>
            ),
          },
          {
            name: '插入点',
            content: (
              <>
                在边上按住 <Kbd>Alt</Kbd>，然后点击 <MouseLeftClick />
              </>
            ),
          },
          {
            name: '删除点',
            content: (
              <>
                在点上按住 <Kbd>Alt</Kbd>，然后点击 <MouseLeftClick />
              </>
            ),
          },
        ],
      },
      {
        label: '矩形框',
        key: 'rect',
        hotkeys: [
          {
            name: '拉框',
            content: <MouseLeftClick />,
          },
          {
            name: '移动边',
            content: (
              <>
                选中边，长按 <MouseLeftClick /> 拖拽边
              </>
            ),
          },
          {
            name: '移动点',
            content: (
              <>
                选中点，长按 <MouseLeftClick /> 拖拽点
              </>
            ),
          },
          {
            name: '取消',
            content: <Kbd>Esc</Kbd>,
          },
        ],
      },
      {
        label: '多边形',
        key: 'polygon',
        hotkeys: [
          {
            name: '标多边形',
            content: <MouseLeftClick />,
          },
          {
            name: '移动边',
            content: (
              <>
                选中边，长按 <MouseLeftClick /> 拖拽边
              </>
            ),
          },
          {
            name: '移动点',
            content: (
              <>
                选中点，长按 <MouseLeftClick /> 拖拽点
              </>
            ),
          },
          {
            name: '插入点',
            content: (
              <>
                在边上按住 <Kbd>Alt</Kbd>，然后点击 <MouseLeftClick />
              </>
            ),
          },
          {
            name: '删除点',
            content: (
              <>
                在点上按住 <Kbd>Alt</Kbd>，然后点击 <MouseLeftClick />
              </>
            ),
          },
          {
            name: '裁剪重叠区域',
            content: (
              <>
                <Kbd>Alt</Kbd> + <Kbd>X</Kbd>
              </>
            ),
          },
          {
            name: '取消',
            content: <Kbd>Esc</Kbd>,
          },
        ],
      },
      {
        label: '3D 立体框',
        key: 'cuboid',
        hotkeys: [
          {
            name: '标 3D 框',
            content: <MouseLeftClick />,
          },
          {
            name: '移动边',
            content: (
              <>
                选中边，长按 <MouseLeftClick /> 拖拽边
              </>
            ),
          },
          {
            name: '移动点',
            content: (
              <>
                选中点，长按 <MouseLeftClick /> 拖拽点
              </>
            ),
          },
          {
            name: '取消',
            content: <Kbd>Esc</Kbd>,
          },
        ],
      },
    ],
  },
];
