import { Annotator } from '@labelu/video-annotator-react';
import type { VideoAnnotation, VideoAnnotationType } from '@labelu/video-react';
import { useState } from 'react';

const mockData1: VideoAnnotation[] = [];

const attributeData = [
  {
    color: '#a600ff',
    key: "Ship's sailing",
    value: 'ship',
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
      id: 'video-segment',
      url: import.meta.env.BASE_URL + 'video-segment.mp4',
      annotations: mockData2,
    },
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
            color: '#ff6600',
            key: "Car's showing",
            value: 'car',
          },
        ],
      }}
    />
  );
}
