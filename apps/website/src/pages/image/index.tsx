import { Annotator as ImageAnnotator } from '@labelu/image-annotator-react';
import { useRef } from 'react';

const samples = [
  {
    url: import.meta.env.BASE_URL + 'sample-1.jpg',
    name: 'sample-1',
    id: 'sample-1',
    meta: {
      width: 1700,
      height: 957,
      rotate: 0,
    },
    data: {},
  },
  {
    url: import.meta.env.BASE_URL + 'sample-2.jpg',
    name: 'sample-2',
    id: 'sample-2',
    meta: {
      width: 1280,
      height: 800,
    },
    data: {},
  },
  {
    url: import.meta.env.BASE_URL + 'sample-3.jpg',
    name: 'sample-3',
    id: 'sample-3',
    meta: {
      width: 1280,
      height: 800,
    },
    data: {},
  },
  {
    url: import.meta.env.BASE_URL + 'sample-4.jpg',
    name: 'sample-4',
    id: 'sample-4',
    meta: {
      width: 1280,
      height: 800,
    },
    data: {},
  },
];

const config = {
  line: {
    lineType: 'spline',
    outOfImage: false,
    labels: [
      {
        id: '1',
        value: 'noneAttribute',
        key: '撒丢我二请问这是一大段文本撒丢我二请问这是一大段文本撒丢我二请问这是一大段文本撒丢我二请问这是一大段文本撒丢我二请问这是一大段文本撒丢我二请问这是一大段文本',
        color: '#ff0000',
      },
      {
        id: 'car',
        value: 'car',
        key: '车子',
        color: '#f69',
      },
    ],
  },
  point: {
    outOfCanvas: false,
    labels: [
      {
        id: '1',
        value: 'noneAttribute',
        key: '无标签',
        color: '#ff0000',
      },
      {
        id: 'car',
        value: 'car',
        key: '车子',
        color: '#f69',
      },
    ],
  },
  rect: {
    outOfImage: false,
    minWidth: 100,
    minHeight: 50,
    labels: [
      {
        id: '1',
        value: 'noneAttribute',
        key: '无标签',
        color: '#e1ff00',
      },
      {
        id: 'car',
        value: 'car',
        key: '车子',
        color: '#6b66ff',
      },
    ],
  },
  polygon: {
    lineType: 'line',
    outOfCanvas: false,
    labels: [
      {
        id: '1',
        value: 'noneAttribute',
        key: '撒丢我二请问这是一大段文本撒丢我二请问这是一大段文本撒丢我二请问这是一大段文本撒丢我二请问这是一大段文本撒丢我二请问这是一大段文本撒丢我二请问这是一大段文本',
        color: '#ff00d4',
      },
      {
        id: 'car',
        value: 'car',
        key: '车子',
        color: '#0920ef',
      },
    ],
  },
  cuboid: {
    labels: [
      {
        id: '1',
        value: 'human',
        key: '人类',
        color: '#9500ff',
      },
      {
        id: 'car',
        value: 'car',
        key: '车子',
        color: '#09ef18',
        attributes: [
          {
            key: '行走姿势',
            value: 'pose',
            type: 'string',
            maxLength: 1000,
            required: true,
            stringType: 'text' as const,
            defaultValue: '奥赛奥赛去无二请问',
            regexp: '',
          },
          {
            key: '人种',
            value: 'race',
            type: 'enum',
            required: true,
            options: [
              {
                key: '非裔',
                value: 'African',
                isDefault: true,
              },
              {
                key: '亚裔',
                value: 'Asian',
              },
              {
                key: '印度裔',
                value: 'Indian',
              },
            ],
          },
        ],
      },
    ],
  },
  text: [
    {
      key: '行走姿势',
      value: 'pose',
      type: 'string',
      maxLength: 1000,
      required: true,
      stringType: 'text' as const,
      defaultValue: '',
      regexp: '',
    },
  ],
};

export default function ImagePage() {
  const annotatorRef = useRef<any>();

  return (
    <ImageAnnotator samples={samples} ref={annotatorRef} offsetTop={148} editingSample={samples[0]} config={config} />
  );
}
