import { Kbd } from '@label-u/components-react';

import { ReactComponent as MouseRightClick } from './mouse-right.svg';

export default [
  {
    label: '通用',
    key: 'common',
    hotkeys: [
      {
        name: '保存',
        content: (
          <span>
            <Kbd>Ctrl S</Kbd> 或 <Kbd>⌘ S</Kbd>
          </span>
        ),
      },
      {
        name: '跳过',
        content: (
          <span>
            <Kbd>Ctrl Space</Kbd> 或 <Kbd>⌘ Space</Kbd>
          </span>
        ),
      },
      {
        name: '撤销',
        content: (
          <span>
            <Kbd>Ctrl Z</Kbd> 或 <Kbd>⌘ Z</Kbd>
          </span>
        ),
      },
      {
        name: '重做',
        content: (
          <span>
            <Kbd>Ctrl Shift Z</Kbd> 或 <Kbd>⌘ ⇧ Z</Kbd>
          </span>
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
        name: '选中标记',
        content: <MouseRightClick />,
      },
      {
        name: '删除标记',
        content: (
          <>
            选中后，按 <Kbd>Delete</Kbd> 或 <Kbd>Backspace</Kbd>
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
        label: '片断分割',
        key: 'segment',
        hotkeys: [
          {
            name: '截取片断',
            content: (
              <span>
                开始和结束按 <Kbd>X</Kbd>
              </span>
            ),
          },
          {
            name: '取消',
            content: <Kbd>Esc</Kbd>,
          },
        ],
      },
      {
        label: '时间戳',
        key: 'frame',
        hotkeys: [
          {
            name: '标时间点',
            content: <Kbd>E</Kbd>,
          },
        ],
      },
    ],
  },
];
