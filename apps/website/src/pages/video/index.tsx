import { Annotator } from '@labelu/video-annotator-react';
import type { VideoAnnotation, VideoAnnotationType } from '@labelu/video-react';
import { useState } from 'react';

const mockData1 = {
  segment: [{ id: 'b2tk865g3w', type: 'segment', start: 7.457498, end: 11.625751, order: 1, label: 'ship' }],
};

const attributeData = [
  {
    color: '#a600ff',
    key: '游艇行驶',
    value: 'ship',
  },
];

const mockData2 = { frame: [{ id: 'eb7wjsga4ei', type: 'frame', time: 12.00722, label: 'car', order: 1 }] };

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
      id: 1,
      name: 'video-segment',
      url: import.meta.env.BASE_URL + 'video-segment.mp4',
      data: mockData1,
    },
    {
      id: 2,
      name: 'video-frame',
      url: import.meta.env.BASE_URL + 'video-frame.mp4',
      data: mockData2,
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
