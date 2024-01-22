import _ from 'lodash';
import type { ImageAnnotatorProps } from '@labelu/image-annotator-react';
import type { ImageSample } from '@labelu/image-annotator-react/dist/context/sample.context';
import { omit } from 'lodash/fp';

import type { SampleData } from '@/api/types';

import { jsonParse } from './index';
import { generateDefaultValues } from './generateGlobalToolDefaultValues';

export function convertImageSample(
  sample: SampleData | undefined,
  sampleId: string | number | undefined,
  config: ImageAnnotatorProps['config'],
): ImageSample | undefined {
  if (!sample || !sampleId) {
    return;
  }

  const id = sampleId!;
  let url = sample.urls[+id];
  // NOTE: urls里只有一个元素
  for (const _id in sample.urls) {
    url = sample.urls[_id];
  }

  let resultParsed: any = {};
  if (sample.result && !_.isNull(sample.result)) {
    resultParsed = jsonParse(sample.result);
  }

  // annotation
  const pool = [
    ['line', 'lineTool'],
    ['point', 'pointTool'],
    ['rect', 'rectTool'],
    ['polygon', 'polygonTool'],
    ['cuboid', 'cuboidTool'],
    ['text', 'textTool'],
    ['tag', 'tagTool'],
  ];

  return {
    id,
    url,
    data: _.chain(pool)
      .map(([type, key]) => {
        if (!resultParsed[key]) {
          return;
        }

        const items = _.get(resultParsed, [key, 'result'], []);
        if (!items.length && (type === 'tag' || type === 'text')) {
          // 生成全局工具的默认值
          return generateDefaultValues(config?.[type]);
        }

        return [
          type,
          items.map((item: any) => {
            const resultItem = {
              ...omit(['attribute'])(item),
              label: item.attribute,
            };

            if (type === 'line' || type === 'polygon') {
              return {
                ...omit(['pointList'])(resultItem),
                type: resultItem.type ?? 'line',
                points: item.pointList ?? item.points,
              };
            }

            return resultItem;
          }),
        ];
      })
      .compact()
      .fromPairs()
      .value(),
  };
}
