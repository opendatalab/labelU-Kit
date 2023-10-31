import React from 'react';
import { useState } from 'react';

import { AudioAnnotator, type AudioAnnotatorProps } from '@labelu/audio-react';
import type { AudioAnnotationType, MediaAnnotationInUI } from '@labelu/interface';

const mockData: any[] = [
  {
    id: '1',
    start: 6.087957,
    end: 11.533612,
    label: 'xfasd',
    attributes: { eeeee: 'ddddasdqwe爱大赛请问', gffffffasd: ['ddd'] },
    type: 'segment',
  },
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

export default function App() {
  const [editingType, setEditingType] = useState<AudioAnnotationType>('segment');
  const [editingLabel, setEditingLabel] = useState<string>('label-2');
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [annotations, setAnnotations] = useState<MediaAnnotationInUI[]>(mockData);
  const handleOnChange = (_annotations: MediaAnnotationInUI[]) => {
    setAnnotations(_annotations);
  };
  const handleOnEnd: AudioAnnotatorProps['onAnnotateEnd'] = (annotation) => {
    setAnnotations([...annotations, annotation]);
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
        toolConfig={{
          segment: {
            type: 'segment',
            attributes: attributeData,
          },
          frame: {
            type: 'frame',
            attributes: attributeData,
          },
        }}
        disabled={isDisabled}
        annotations={annotations}
        onAnnotateEnd={handleOnEnd}
        onChange={handleOnChange}
      />
      <hr />
      <div>
        标注类型：
        <select
          value={editingType}
          onChange={(e) => {
            setEditingType(e.target.value as AudioAnnotationType);
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
