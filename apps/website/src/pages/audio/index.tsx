import { Annotator } from '@labelu/audio-annotator-react';
import { useState } from 'react';

const samples = [
  {
    id: 'audio-segment',
    url: import.meta.env.BASE_URL + 'audio-segment.mp3',
    name: 'audio-segment',
    annotations: [
      { id: '1', start: 5.496299, end: 8.477484, label: 'the_old_man_is_taking', type: 'segment', order: 1 },
      { id: '4rsakqmt9zt', type: 'segment', start: 9.952124, end: 19.653833, order: 2, label: 'the_old_man_is_taking' },
      {
        id: 'go8t24wjfbe',
        type: 'segment',
        start: 27.304808,
        end: 36.858098,
        order: 3,
        label: 'the_old_man_is_taking',
      },
    ],
  },
  {
    id: 'audio-frame',
    url: import.meta.env.BASE_URL + 'audio-frame.m4a',
    name: 'audio-frame',
    annotations: [{ id: 'wo2tiebj64e', type: 'frame', time: 5.2, label: 'mon_is_getting_upset', order: 3 }],
  },
];

const annotatorConfig = {
  segment: [
    {
      color: '#e600ff',
      key: '老人说话',
      value: 'the_old_man_is_taking',
    },
  ],
  frame: [
    {
      color: '#40ff00',
      key: '妈妈开始生气',
      value: 'mon_is_getting_upset',
    },
  ],
};

export default function AudioPage() {
  const [editType, setEditType] = useState('segment');

  return <Annotator samples={samples} type={editType} config={annotatorConfig} offsetTop={156} />;
}
