import { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import type { VideoAnnotation, VideoAnnotationType } from '@label-u/video-react';

import Editor from '../Editor';
import type { VideoSample } from '../Editor/context';

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  flex-direction: column;

  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
`;

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
  }
`;

const mockData1: VideoAnnotation[] = [
  {
    id: '1',
    start: 6.087957,
    end: 11.533612,
    label: 'xfasd',
    attributes: { eeeee: 'ddddasdqwe爱大赛请问', gffffffasd: 'ddd' },
    visible: true,
    type: 'segment',
    order: 1,
  },
  {
    id: '121',
    value: {
      asdddd: 'gasdqweq',
    },
    type: 'text',
  },
  {
    id: '1ddda1',
    value: {
      'label-1': 'xxxxx',
    },
    type: 'text',
  },
  {
    id: '1ddxxxxda1',
    value: {
      'label-11233': ['yyyyyyy'],
    },
    type: 'tag',
  },
  {
    id: '2',
    time: 14,
    label: 'label-2',
    attributes: { eeeee: 'vvzxc', gffffffasd: 'ddd' },
    visible: true,
    type: 'frame',
    order: 15,
  },
  { id: 'ciwn339hr7', type: 'segment', order: 3, start: 14.239382, end: 23.094575, label: 'label-2' },
  { id: 'wmy061xgch9', type: 'segment', order: 5, start: 22.613409, end: 32, label: 'label-2' },
  { id: 'afc4u4tb3n9', type: 'segment', order: 6, start: 32.4, end: 37.4, label: 'label-2' },
  { id: 'bm6bg3by2zv', type: 'segment', order: 7, start: 38.4, end: 42.1, label: 'label-2' },
  { id: 'h7r76w6ldv6', type: 'segment', order: 8, start: 1.7, end: 8.3, label: 'label-2' },
  { id: '9f2jb81mv5c', type: 'segment', order: 9, start: 9.9, end: 12.9, label: 'label-2' },
  { id: 'xgn2mhett', type: 'segment', order: 10, start: 17.9, end: 29.690047, label: 'label-2' },
  { id: '8jc7k83i8mp', type: 'segment', order: 11, start: 23.7, end: 33.823799, label: 'label-2' },
  { id: 'fu7qfbp1oyc', type: 'segment', order: 12, start: 42.8, end: 45.6, label: 'label-2' },
  { id: 'apyldbrgnrg', type: 'frame', time: 15.2, order: 14, label: 'xfasd' },
  { id: 'xnkieti5vns', type: 'segment', order: 13, start: 27.7, end: 34.6, label: 'label-2' },
];

const attributeData = [
  {
    color: '#ff6600',
    key: '标签-1',
    value: 'xfasd',
    attributes: [
      {
        key: 'asdasd',
        value: 'eeeee',
        type: 'string',
        maxLength: 1000,
        required: true,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'gffffffasd',
        type: 'enum',
        required: true,
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#ae3688',
    key: '标签-2',
    value: 'label-2',
    attributes: [
      {
        key: 'asdasd',
        value: 'eeeee',
        type: 'string',
        maxLength: 1000,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'gffffffasd',
        type: 'enum',
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#00b112',
    key: '标签-3',
    value: 'label-3',
    attributes: [
      {
        key: 'asdasd',
        value: 'vxcsde',
        type: 'string',
        maxLength: 1000,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'kyhklh',
        type: 'enum',
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#1900ff',
    key: '标签-4',
    value: 'label-4',
    attributes: [
      {
        key: 'asdasd',
        value: 'vxcx',
        type: 'string',
        maxLength: 1000,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'xcvsdf',
        type: 'enum',
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#ff6600',
    key: '标签-1',
    value: 'xfasdxz',
    attributes: [
      {
        key: 'asdasd',
        value: 'eeeee',
        type: 'string',
        maxLength: 1000,
        required: true,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'gffffffasd',
        type: 'enum',
        required: true,
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#ae3688',
    key: '标签-2',
    value: 'label-2vv',
    attributes: [
      {
        key: 'asdasd',
        value: 'eeeee',
        type: 'string',
        maxLength: 1000,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'gffffffasd',
        type: 'enum',
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#00b112',
    key: '标签-3',
    value: 'label-3zqe',
    attributes: [
      {
        key: 'asdasd',
        value: 'vxcsde',
        type: 'string',
        maxLength: 1000,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'kyhklh',
        type: 'enum',
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#1900ff',
    key: '标签-4',
    value: 'label-5123444',
    attributes: [
      {
        key: 'asdasd',
        value: 'vxcx',
        type: 'string',
        maxLength: 1000,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'xcvsdf',
        type: 'enum',
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#ff6600',
    key: '标签-1',
    value: 'xfasdxz2',
    attributes: [
      {
        key: 'asdasd',
        value: 'eeeee',
        type: 'string',
        maxLength: 1000,
        required: true,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'gffffffasd',
        type: 'enum',
        required: true,
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#ae3688',
    key: '标签-2',
    value: 'label-2vv3123',
    attributes: [
      {
        key: 'asdasd',
        value: 'eeeee',
        type: 'string',
        maxLength: 1000,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'gffffffasd',
        type: 'enum',
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#00b112',
    key: '标签-3',
    value: 'label-3zqevcx',
    attributes: [
      {
        key: 'asdasd',
        value: 'vxcsde',
        type: 'string',
        maxLength: 1000,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'kyhklh',
        type: 'enum',
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
  {
    color: '#1900ff',
    key: '标签-4',
    value: 'label-ccczx',
    attributes: [
      {
        key: 'asdasd',
        value: 'vxcx',
        type: 'string',
        maxLength: 1000,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'vvvv',
        value: 'xcvsdf',
        type: 'enum',
        options: [
          {
            key: 'ffff',
            value: 'ddd',
          },
        ],
      },
    ],
  },
];

const mockData2: VideoAnnotation[] = [
  {
    id: '1',
    start: 6.087957,
    end: 11.533612,
    label: 'xfasd',
    attributes: { eeeee: 'ddddasdqwe爱大赛请问', gffffffasd: 'ddd' },
    visible: true,
    type: 'segment',
    order: 3,
  },
];

export default function App() {
  const [editingType, setEditingType] = useState<VideoAnnotationType>('segment');
  const [editingLabel, setEditingLabel] = useState<string>('label-2');
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const labelOptions = attributeData.map((item) => {
    return {
      label: item.key,
      value: item.value,
    };
  });

  const [samples, updateSamples] = useState<VideoSample[]>([
    {
      id: 'sample-1',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      annotations: mockData1,
    },
    {
      id: 'sample-2',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      annotations: mockData2,
    },
    {
      id: 'sample-3',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      annotations: mockData1,
    },
    {
      id: 'sample-4',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      annotations: mockData2,
    },
    {
      id: 'sample-5',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      annotations: mockData1,
    },
    {
      id: 'sample-6',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      annotations: mockData2,
    },
    {
      id: 'sample-7',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      annotations: mockData1,
    },
    {
      id: 'sample-8',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      annotations: mockData2,
    },
    {
      id: 'sample-9',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      annotations: mockData1,
    },
    {
      id: 'sample-10',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      annotations: mockData2,
    },
    {
      id: 'sample-11',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      annotations: mockData1,
    },
    {
      id: 'sample-12',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      annotations: mockData2,
    },
  ]);

  return (
    <Wrapper>
      <GlobalStyle />
      <div className="body">
        <Editor
          samples={samples}
          type={editingType}
          config={{
            attributes: attributeData,
            segment: {
              type: 'segment',
              attributes: [
                {
                  color: '#ff6600',
                  key: '标签-1',
                  value: 'xfasd',
                  attributes: [
                    {
                      key: 'asdasd',
                      value: 'eeeee',
                      type: 'string',
                      maxLength: 1000,
                      required: true,
                      stringType: 'text' as const,
                      defaultValue: '',
                      regexp: '',
                    },
                    {
                      key: 'vvvv',
                      value: 'gffffffasd',
                      type: 'enum',
                      required: true,
                      options: [
                        {
                          key: 'ffff',
                          value: 'ddd',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            frame: {
              type: 'frame',
              attributes: attributeData,
            },
            tag: [
              {
                key: '标签-1',
                value: 'label-11233',
                type: 'array',
                options: [
                  {
                    key: '标签-1-1',
                    value: 'label-1-1',
                    isDefault: false,
                  },
                  {
                    key: 'mkljljljlkj',
                    value: 'iouiio',
                    isDefault: false,
                  },
                ],
              },
            ],
            text: [
              {
                key: '念书1',
                value: 'asdddd',
                type: 'string',
                maxLength: 1000,
                required: true,
                stringType: 'text' as const,
                defaultValue: '',
                regexp: '',
              },
              {
                key: '标签-1',
                value: 'label-1',
                type: 'string',
                maxLength: 1000,
                stringType: 'text',
                required: false,
                defaultValue: '',
              },
            ],
          }}
        />
      </div>
    </Wrapper>
  );
}
