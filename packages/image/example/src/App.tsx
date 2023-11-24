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
        strokeWidth: 1,
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
        strokeWidth: 1,
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
  });

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
          order: 1,
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
      ]);

      engine.pick('line', 'car');
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
  }, [engine]);

  return <div style={{ margin: '10rem 0 0 10rem' }} ref={ref} />;
}
