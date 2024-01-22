import { Annotator as ImageAnnotator } from '@labelu/image-annotator-react';
import { useRef } from 'react';

const samples = [
  {
    url: '/model.jpg',
    name: 'aaaa',
    id: '1',
    meta: {
      width: 2560,
      height: 1709,
      rotate: 90,
    },
    data: {
      line: [
        {
          points: [
            {
              x: 346.88414634146346,
              y: 229.8300304878049,
              id: 'eWT6BJJv',
            },
            {
              x: 481.39024390243907,
              y: 328.9397865853659,
              id: 'ITAQu1gF',
            },
            {
              x: 322.10670731707324,
              y: 385.5739329268293,
              id: 'G4c3972f',
            },
            {
              x: 300.86890243902445,
              y: 309.4717987804878,
              id: 'PMCqLAsQ',
            },
          ],
          id: 'rW5Jbd8G',
          attributes: {},
          type: 'line',
          order: 1,
          label: 'noneAttribute',
        },
        {
          points: [
            {
              x: 446.88414634146346,
              y: 429.8300304878049,
              id: 'eWT6BJJv-1',
            },
            {
              x: 81.39024390243907,
              y: 28.9397865853659,
              id: 'ITAQu1gF-2',
            },
            {
              x: 200.86890243902445,
              y: 109.4717987804878,
              id: 'PMCqLAsQ-4',
            },
          ],
          id: 'rW5Jbd8G2',
          attributes: {},
          type: 'line',
          order: 2,
          label: 'car',
        },
      ],
      point: [
        {
          x: 134.5060975609757,
          y: 376.7248475609756,
          valid: true,
          id: 'pWiUgJIH',
          order: 3,
          label: 'car',
        },
        {
          x: 114.5060975609757,
          y: 76.7248475609756,
          valid: true,
          id: 'pWiUgJIH-2',
          order: 4,
          label: 'noneAttribute',
        },
      ],

      rect: [
        {
          x: 148.66463414634154,
          y: 294.4123475609755,
          width: 168.1326219512195,
          height: 134.5060975609756,
          valid: true,
          id: '0kjFS5rI',
          order: 6,
          label: 'noneAttribute',
        },
        {
          x: 515.016768292683,
          y: 103.2614329268292,
          width: 194.67987804878047,
          height: 69.02286585365853,
          valid: true,
          id: 'AcO6GXyc',
          order: 7,
          label: 'car',
        },
      ],

      polygon: [
        {
          id: 'FuzuAJ4q',
          valid: true,
          type: 'line',
          isVisible: true,
          points: [
            {
              x: 103.4969512195122,
              y: 205.0312499999999,
            },
            {
              x: 307.0365853658536,
              y: 235.9977134146341,
            },
            {
              x: 10.8368902439024,
              y: 102.3711890243901,
            },
            {
              x: 22.0746951219511,
              y: 31.5785060975609,
            },
            {
              x: 339.6859756097559,
              y: 164.3254573170731,
            },
          ],
          order: 12,
          label: 'car',
        },
      ],

      cuboid: [
        {
          label: 'car',
          direction: 'front',
          id: 'dmjIbMoD',
          order: 16,
          front: {
            tl: {
              x: 189.98858647936788 + 700,
              y: 192.48726953467954 + 700,
            },
            tr: {
              x: 254.1510096575944 + 700,
              y: 192.48726953467954 + 700,
            },
            bl: {
              x: 189.98858647936788 + 700,
              y: 253.65144863915717 + 700,
            },
            br: {
              x: 254.1510096575944 + 700,
              y: 253.65144863915717 + 700,
            },
          },
          back: {
            br: {
              x: 296.7260755048288 + 700,
              y: 217.07287093942054 + 700,
            },
            tr: {
              x: 296.7260755048288 + 700,
              y: 155.9086918349429 + 700,
            },
            tl: {
              x: 232.56365232660232 + 700,
              y: 155.9086918349429 + 700,
            },
            bl: {
              x: 232.56365232660232 + 700,
              y: 217.07287093942054 + 700,
            },
          },
          attributes: {
            pose: '直立行走',
            race: ['African'],
          },
        },
      ],

      text: [
        {
          id: '123123',
          type: 'text',
          value: {
            pose: '2312312312312123',
          },
        },
      ],
    },
  },
  {
    url: '/car.jpg',
    name: 'aaaa',
    id: '2',
    meta: {
      width: 2560,
      height: 1436,
    },
    data: {
      line: [],
      point: [
        {
          x: 534.5060975609757,
          y: 576.7248475609756,
          valid: true,
          id: 'pWiUgJIH',
          order: 3,
          label: 'car',
        },
        {
          x: 114.5060975609757,
          y: 76.7248475609756,
          valid: true,
          id: 'pWiUgJIH-2',
          order: 4,
          label: 'noneAttribute',
        },
      ],
    },
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

  window.annotatorRef = annotatorRef;

  return (
    <ImageAnnotator samples={samples} ref={annotatorRef} offsetTop={148} editingSample={samples[0]} config={config} />
  );
}
