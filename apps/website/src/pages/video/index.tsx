import { Annotator } from '@labelu/video-annotator-react';
import type { VideoAnnotation, VideoAnnotationType } from '@labelu/video-react';
import { useState } from 'react';

const mockData1: VideoAnnotation[] = [
  { id: 'b2tk865g3w', type: 'segment', start: 1.4704797911227154, end: 7.903828, order: 1, label: 'ship' },
];

const attributeData = [
  {
    color: '#a600ff',
    key: '游艇行驶',
    value: 'ship',
  },
];

const mockData2: VideoAnnotation[] = [{ id: 'eb7wjsga4ei', type: 'frame', time: 12.00722, label: 'car', order: 1 }];

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
      annotations: mockData1,
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
            key: '汽车出现',
            value: 'car',
          },
        ],
      }}
    />
  );
}
