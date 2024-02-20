import { Annotator } from '@labelu/video-annotator-react';
import type { VideoAnnotation, VideoAnnotationType } from '@labelu/video-react';
import { useState } from 'react';

const mockData1: VideoAnnotation[] = [];

const attributeData = [
  {
    color: '#a600ff',
    key: 'Rabbit',
    value: 'rabbit',
    attributes: [
      {
        key: 'What is the rabbit doing?',
        value: 'activity',
        type: 'string',
        maxLength: 1000,
        required: true,
        stringType: 'text' as const,
        defaultValue: '',
        regexp: '',
      },
      {
        key: 'Size of the rabbit',
        value: 'size',
        type: 'enum',
        required: true,
        options: [
          {
            key: 'Small',
            value: 'small',
          },
          {
            key: 'Medium',
            value: 'medium',
          },
          {
            key: 'Large',
            value: 'large',
          },
        ],
      },
    ],
  },
  {
    color: '#ad722f',
    key: 'Squirrel',
    value: 'squirrel',
  },
];

const mockData2: VideoAnnotation[] = [];

export default function VideoPage() {
  const [editingType, setEditingType] = useState<VideoAnnotationType>('segment');
  const [editingLabel, setEditingLabel] = useState<string>('label-2');
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const labelOptions = attributeData.map((item) => {
    return {
      label: item.key,
      value: item.value,
    };
  });

  const [samples, updateSamples] = useState<any[]>([
    {
      id: 'video-frame',
      url: import.meta.env.BASE_URL + 'video-frame.mp4',
      annotations: mockData2,
    },
  ]);

  return (
    <Annotator
      samples={samples}
      offsetTop={156}
      type={editingType}
      config={{
        segment: attributeData,
        frame: [
          {
            color: '#00ff44',
            key: 'Forest',
            value: 'forest',
          },
        ],
      }}
    />
  );
}
