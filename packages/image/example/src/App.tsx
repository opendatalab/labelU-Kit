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

const tools = [{ name: 'point' }, { name: 'line' }, { name: 'rect' }];

export default function App() {
  const ref = useRef<HTMLDivElement>(null);
  const engine = useEngine(ref, {
    width: 800,
    height: 600,
    cursor: {
      style: {
        strokeWidth: 1,
        stroke: '#91ff00',
      },
    },
    line: {
      style: {
        strokeWidth: 5,
      },
      hoveredStyle: {
        stroke: '#f60',
        strokeWidth: 10,
      },
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
    point: {
      style: {
        strokeWidth: 3,
        radius: 5,
      },
      hoveredStyle: {
        fill: '#007bff',
        stroke: '#fff',
        strokeWidth: 10,
      },
      selectedStyle: {
        fill: '#fff',
      },
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
      style: {
        strokeWidth: 3,
      },
      hoveredStyle: {
        fill: '#007bff37',
        stroke: '#fff',
        strokeWidth: 5,
      },
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
          pointList: [
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
          order: 1,
          label: 'noneAttribute',
        },
        {
          pointList: [
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

      engine.switch('point', 'car');
    });

    engine.on('hover', (data) => {
      console.log('hover', data);
    });

    engine.on('complete', () => {
      console.log("Engine's ready");
    });
    engine.on('error', () => {
      console.error('Error');
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