import { useState } from 'react';
import { Annotator } from '@labelu/audio-annotator-react';

const samples = [
  {
    id: 'sample-12s',
    url: '/sample-15s.mp3',
    name: 'sample-12s.mp3',
    annotations: [
      {
        id: '1',
        start: 6.087957,
        end: 11.533612,
        label: 'vehicle',
        type: 'segment',
        order: 1,
      },
    ],
  },
];

const annotatorConfig = {
  // Global attributes, Available for segment and frame
  attributes: [
    {
      color: '#f8e8',
      key: 'Humanbeing',
      value: 'humanbeing',
    },
  ],
  segment: [
    {
      color: '#ff6600',
      key: 'Vehicle',
      value: 'vehicle',
      attributes: [
        {
          key: 'Color',
          value: 'color',
          type: 'string',
          maxLength: 1000,
          required: true,
          stringType: 'text' as const,
          defaultValue: '',
          regexp: '',
        },
        {
          key: 'Category',
          value: 'category',
          type: 'enum',
          required: true,
          options: [
            {
              key: 'Truck',
              value: 'truck',
            },
            {
              key: 'Mini Van',
              value: 'mini-van',
            },
            {
              key: 'Sedan',
              value: 'sedan',
            },
          ],
        },
      ],
    },
    {
      color: '#ae3688',
      key: 'Boat',
      value: 'boat',
      attributes: [
        {
          key: 'Contoury',
          value: 'contoury',
          type: 'enum',
          options: [
            {
              key: 'USA',
              value: 'usa',
            },
            {
              key: 'China',
              value: 'china',
            },
            {
              key: 'Japan',
              value: 'japan',
            },
          ],
        },
      ],
    },
  ],
};

export default function AudioPage() {
  const [editType, setEditType] = useState('segment');

  return <Annotator samples={samples} type={editType} config={annotatorConfig} offsetTop={156} />;
}
