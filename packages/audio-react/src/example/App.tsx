import { useState } from 'react';

import Video, { AudioAnnotator } from '../Audio';
import type { AudioAnnotation } from '../AnnotationBar';

const mockData: AudioAnnotation[] = [
  {
    id: '1',
    start: 6.087957,
    end: 11.533612,
    label: 'xfasd',
    attributes: { eeeee: 'ddddasdqwe爱大赛请问', gffffffasd: ['ddd'] },
    type: 'segment',
  },
  {
    id: '2',
    time: 14,
    label: 'label-2',
    attributes: { eeeee: 'vvzxc', gffffffasd: ['ddd'] },
    type: 'frame',
  },
  { id: 'ciwn339hr7', type: 'segment', start: 14.239382, end: 23.094575, label: 'label-2' },
  { id: 'wmy061xgch9', type: 'segment', start: 22.613409, end: 32, label: 'label-2' },
  { id: 'afc4u4tb3n9', type: 'segment', start: 32.4, end: 37.4, label: 'label-2' },
  { id: 'bm6bg3by2zv', type: 'segment', start: 38.4, end: 42.1, label: 'label-2' },
  { id: 'h7r76w6ldv6', type: 'segment', start: 1.7, end: 8.3, label: 'label-2' },
  { id: '9f2jb81mv5c', type: 'segment', start: 9.9, end: 12.9, label: 'label-2' },
  { id: 'xgn2mhett', type: 'segment', start: 17.9, end: 29.690047, label: 'label-2' },
  { id: '8jc7k83i8mp', type: 'segment', start: 23.7, end: 33.823799, label: 'label-2' },
  { id: 'fu7qfbp1oyc', type: 'segment', start: 42.8, end: 45.6, label: 'label-2' },
  { id: 'apyldbrgnrg', type: 'frame', time: 15.2, label: 'xfasd' },
  { id: 'xnkieti5vns', type: 'segment', start: 27.7, end: 34.6, label: 'label-2' },
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
];

export default function Doc() {
  const [editingType, setEditingType] = useState<VideoAnnotationType>('segment');
  const [editingLabel, setEditingLabel] = useState<string>('label-2');
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>(mockData);
  const handleOnChange = (_annotations: VideoAnnotation[]) => {
    setAnnotations(_annotations);
  };
  const labelOptions = attributeData.map((item) => {
    return {
      label: item.key,
      value: item.value,
    };
  });

  return (
    <div style={{ width: 800, height: 600 }}>
      <AudioAnnotator
        src="/sample-15s.mp3"
        editingType={editingType}
        editingLabel={editingLabel}
        // @ts-ignore
        attributes={attributeData}
        disabled={isDisabled}
        annotations={annotations}
        onChange={handleOnChange}
      />
      <hr />
      <div>
        标注类型：
        <select
          value={editingType}
          onChange={(e) => {
            setEditingType(e.target.value as VideoAnnotationType);
          }}
        >
          <option value="">none</option>
          <option value="segment">segment</option>
          <option value="frame">frame</option>
        </select>
      </div>
      <div>
        标签：
        <select
          value={editingLabel}
          onChange={(e) => {
            setEditingLabel(e.target.value);
          }}
        >
          {labelOptions.map((item) => {
            return (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            );
          })}
        </select>
      </div>
      <div>
        禁用：
        <input
          type="checkbox"
          checked={isDisabled}
          onChange={(e) => {
            setIsDisabled(e.target.checked);
          }}
        />
      </div>
    </div>
  );
}
