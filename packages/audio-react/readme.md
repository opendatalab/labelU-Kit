# @labelu/audio-react

[![npm](https://img.shields.io/npm/v/%40labelu/audio-react.svg)](https://www.npmjs.com/package/@labelu/audio-react)

## 安装

```bash
npm install @labelu/audio-react
```

## 使用

> [example](./src/example)

```tsx
import React from 'react';
import Audio from '@labelu/audio-react';

function App() {
  const [annotations, setAnnotations] = useState([]);
  return (
    <AudioAnnotator
      editingLabel="abc"
      src="https://exmaple/audio.mp3"
      editingType="segment"
      annotations={annotations}
      toolConfig={{
        segment: [
          {
            type: 'segment',
            attributes: [
              {
                color: '#ff0000',
                type: 'string',
                key: 'label',
                value: 'abc',
              },
            ],
          },
        ],
      }}
      onChange={setAnnotations}
    />
  );
}
```

## API

[Documentation](https://opendatalab.github.io/labelU-Kit/)
