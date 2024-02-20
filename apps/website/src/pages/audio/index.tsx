import { Annotator } from '@labelu/audio-annotator-react';
import { useState } from 'react';

const samples = [
  {
    id: 'audio-segment',
    url: import.meta.env.BASE_URL + 'audio-segment.mp3',
    name: 'audio-segment',
    annotations: [
      {
        id: '1',
        start: 6.087957,
        end: 11.533612,
        label: 'girls_taking',
        type: 'segment',
        order: 1,
      },
      {
        id: '3',
        time: 13,
        label: 'vehicle',
        type: 'frame',
        order: 2,
      },
    ],
  },
  {
    id: 'audio-frame',
    url: import.meta.env.BASE_URL + 'audio-frame.m4a',
    name: 'audio-frame',
    annotations: [
      {
        id: '1',
        start: 6.087957,
        end: 11.533612,
        label: 'girls_taking',
        type: 'frame',
        order: 1,
      },
      {
        id: '3',
        time: 13,
        label: 'vehicle',
        type: 'frame',
        order: 2,
      },
    ],
  },
];

const annotatorConfig = {
  segment: [
    {
      color: '#e600ff',
      key: 'Girls talking',
      value: 'girls_taking',
    },
  ],
  frame: [
    {
      color: '#40ff00',
      key: 'Vehicle',
      value: 'vehicle',
    },
  ],
};

export default function AudioPage() {
  const [editType, setEditType] = useState('segment');

  return <Annotator samples={samples} type={editType} config={annotatorConfig} offsetTop={156} />;
}
