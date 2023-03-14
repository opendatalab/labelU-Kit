import _ from 'lodash-es';

import type { IShortcut } from '@/types/tool';

import { rewind, backward, forward, forwardForward, fullScreen, playPause, speed, saveResult } from '../common';
import { tagInSingleImg } from '../tag';

const videoForward = _.cloneDeep(forward);
const videoBackward = _.cloneDeep(backward);

videoForward.name = 'NextFile';
videoBackward.name = 'PreviousFile';

const videoTagToolShortCurTable: IShortcut[] = [
  saveResult,
  tagInSingleImg,
  playPause,
  speed,
  rewind,
  forwardForward,
  fullScreen,
  videoBackward,
  videoForward,
];

export default videoTagToolShortCurTable;
