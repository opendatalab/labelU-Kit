import { i18n } from '@label-u/utils';

import { ReactComponent as ScaleShortCutSvg } from '@/assets/annotation/toolHotKeyIcon/icon_mouse_middle_kj.svg';
import { ReactComponent as MouseRightClick } from '@/assets/annotation/toolHotKeyIcon/icon_mouse_right_kj.svg';
import { ReactComponent as MouseLeftClick } from '@/assets/annotation/toolHotKeyIcon/icon_mouse_left_kj.svg';

interface HotkeyDesc {
  name: string;
  title: string | JSX.Element;
}

export const common: HotkeyDesc[] = [
  {
    name: 'Save',
    title: 'Ctrl + S',
  },
  {
    name: 'Skip',
    title: 'Ctrl + Space',
  },
  {
    name: 'Undo',
    title: 'Ctrl + Z',
  },
  {
    name: 'Redo',
    title: 'Ctrl + Shift + Z',
  },
  {
    name: 'PreviousImage',
    title: 'A',
  },
  {
    name: 'NextImage',
    title: 'D',
  },
  {
    name: 'Scale',
    title: <ScaleShortCutSvg />,
  },
];

export const action: HotkeyDesc[] = [
  {
    name: 'Rotate', // 旋转图片(顺时针90°)
    title: 'R',
  },
  {
    name: 'Move',
    title: (
      <div>
        长按 <MouseRightClick />
      </div>
    ),
  },
  {
    name: 'Select',
    title: <MouseRightClick />,
  },
  {
    name: 'DeleteTarget',
    title: i18n.t('Select target and press Delete')!,
  },
  {
    name: 'Upper',
    title: '↑',
  },
  {
    name: 'Lower',
    title: '↓',
  },
  {
    name: 'Cancel',
    title: 'Esc',
  },
];

export const rect: HotkeyDesc[] = [
  {
    name: 'AnnotateRect', // 旋转图片(顺时针90°)
    title: <MouseLeftClick />,
  },
  {
    name: 'MoveEdge',
    title: (
      <div>
        {i18n.t('Select edge, Press and hold')} <MouseLeftClick /> {i18n.t('then drag')}
      </div>
    ),
  },
  {
    name: 'MovePoint',
    title: (
      <div>
        {i18n.t('Select point, Press and hold')} <MouseLeftClick /> {i18n.t('then drag')}
      </div>
    ),
  },
  {
    name: 'Cancel',
    title: (
      <div>
        Esc / <MouseRightClick />
      </div>
    ),
  },
];

export const polygon: HotkeyDesc[] = [
  {
    name: 'AnnotatePolygon',
    title: <MouseLeftClick />,
  },
  {
    name: 'MoveEdge',
    title: (
      <div>
        {i18n.t('Select edge, Press and hold')} <MouseLeftClick /> {i18n.t('then drag')}
      </div>
    ),
  },
  {
    name: 'MovePoint',
    title: (
      <div>
        {i18n.t('Select point, Press and hold')} <MouseLeftClick /> {i18n.t('then drag')}
      </div>
    ),
  },
  {
    name: 'ContinueToLabel',
    title: <div>{i18n.t('Select and press')} Space</div>,
  },
  {
    name: 'InsertPoint',
    title: (
      <span>
        {i18n.t('Select and click')} <MouseLeftClick />
      </span>
    ),
  },
  {
    name: 'DeletePoint',
    title: <span> {i18n.t('Select and')} Delete</span>,
  },
  {
    name: 'CropOverlapArea',
    title: 'Alt + X',
  },
];

export const point: HotkeyDesc[] = [
  {
    name: 'AnnotatePoint',
    title: <MouseLeftClick />,
  },
  {
    name: 'MovePoint',
    title: (
      <div>
        {i18n.t('Select point, Press and hold')} <MouseLeftClick /> {i18n.t('then drag')}
      </div>
    ),
  },
];

export const line: HotkeyDesc[] = [
  {
    name: 'AnnotateLine',
    title: <MouseLeftClick />,
  },
  {
    name: 'HorizontalOrVertical',
    title: (
      <div>
        Shift + <MouseLeftClick />
      </div>
    ),
  },
  {
    name: 'MovePoint',
    title: (
      <div>
        {i18n.t('Select point, Press and hold')} <MouseLeftClick /> {i18n.t('then drag')}
      </div>
    ),
  },
  {
    name: 'InsertPoint',
    title: (
      <span>
        {i18n.t('Select point and click')} <MouseLeftClick />
      </span>
    ),
  },
  {
    name: 'DeletePoint',
    title: <span>{i18n.t('Select and')} Delete</span>,
  },
  {
    name: 'ContinueToLabel',
    title: <div>{i18n.t('Select and press')} Space</div>,
  },
];
