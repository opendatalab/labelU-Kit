import { Kbd, getOS } from '@label-u/components-react';

import { ReactComponent as MouseRightClick } from './mouse-right.svg';
const os = getOS();

export default [
  {
    label: '通用',
    key: 'common',
    hotkeys: [
      {
        name: '保存',
        content: os === 'MacOS' ? <Kbd>⌘ S</Kbd> : <Kbd>Ctrl S</Kbd>,
      },
      {
        name: '跳过',
        content: os === 'MacOS' ? <Kbd>⌘ Space</Kbd> : <Kbd>Ctrl Space</Kbd>,
      },
      {
        name: '撤销',
        content: os === 'MacOS' ? <Kbd>⌘ Z</Kbd> : <Kbd>Ctrl Z</Kbd>,
      },
      {
        name: '重做',
        content: os === 'MacOS' ? <Kbd>⌘ ⇧ Z</Kbd> : <Kbd>Ctrl Shift Z</Kbd>,
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
        name: '播放 / 暂停',
        content: <Kbd>Space</Kbd>,
      },
      {
        name: '增倍率',
        content: os === 'MacOS' ? <Kbd>⌘ →</Kbd> : <Kbd>Ctrl →</Kbd>,
      },
      {
        name: '减倍率',
        content: os === 'MacOS' ? <Kbd>⌘ ←</Kbd> : <Kbd>Ctrl ←</Kbd>,
      },
      {
        name: '前进',
        content: <Kbd>→</Kbd>,
      },
      {
        name: '后退',
        content: <Kbd>←</Kbd>,
      },
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
