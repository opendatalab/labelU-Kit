import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useState } from 'react';
import { Annotator } from '@labelu/image';

export const useEngine = (containerRef: React.RefObject<HTMLDivElement>, options?: any) => {
  const [engine, setAnnotationEngine] = useState<any | null>(null);
  const [optionsState, setOptionsState] = useState<any | null>(options);

  useEffect(() => {
    if (JSON.stringify(options) === JSON.stringify(optionsState)) {
      return;
    }

    setOptionsState(options);
  }, [options]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const ae = new Annotator({
      container: containerRef.current,
      ...(options || {}),
    });

    setAnnotationEngine(ae);

    return () => {
      setAnnotationEngine(null);
      ae.destroy();
    };
  }, [optionsState, containerRef]);

  return engine;
};

const tools = [{ name: 'point' }, { name: 'line' }, { name: 'rect' }, { name: 'polygon' }, { name: 'cuboid' }];

export default function App() {
  const ref = useRef<HTMLDivElement>(null);
  const engine = useEngine(ref, {
    width: 800,
    height: 600,
    showOrder: true,
    cursor: {
      style: {
        stroke: '#91ff00',
      },
    },
    line: {
      lineType: 'line',
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
              defaultValue: '',
              regexp: '',
            },
            {
              key: '人种',
              value: 'race',
              type: 'enum',
              required: true,
              options: [
                {
                  key: '黑人',
                  value: 'black',
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const [tool, setTool] = useState('point');
  const [label, setLabel] = useState('car');

  useLayoutEffect(() => {
    if (!engine) {
      return;
    }

    engine.loadImage('/model.jpg').then(() => {
      engine.loadData('line', [
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
      ]);
      engine.loadData('point', [
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
      ]);

      engine.loadData('rect', [
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
      ]);

      engine.loadData('polygon', [
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
      ]);

      engine.loadData('cuboid', [
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
            race: 'black',
          },
        },
      ]);

      engine.switch('point', 'car');
    });

    engine.on('hover', (data) => {
      console.log('hover', data);
    });

    engine.on('add', (...args) => {
      console.info('add', ...args);
    });

    engine.on('select', (...args) => {
      console.info('select', ...args);
    });

    engine.on('unselect', (...args) => {
      console.info('unselect', ...args);
    });

    engine.on('complete', () => {
      console.log("Engine's ready");
    });
    engine.on('error', (error) => {
      console.error('Error', error);
    });
    engine.on('delete', (...args) => {
      console.info('Delete', ...args);
    });
    engine.on('render', () => {
      console.log('Render');
    });
    engine.on('toolChange', (toolName: string, label: string) => {
      setTool(toolName);
      setLabel(label);
    });
  }, [engine]);

  const switchTool = (tool: string) => () => {
    engine.switch(tool, 'car');
    setTool(tool);
    setLabel('car');
  };

  return (
    <div>
      <div style={{ margin: '10rem 0 0 10rem' }} ref={ref} />
      <div>
        {tools.map((item) => (
          <button
            style={{
              backgroundColor: tool === item.name ? '#f60' : '#fff',
              color: tool === item.name ? '#fff' : '#333',
              border: '1px solid #e2e2e2',
              margin: '0 4px',
              padding: '4px 8px',
              borderRadius: 3,
              cursor: 'pointer',
            }}
            onClick={switchTool(item.name)}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
