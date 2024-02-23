import _ from 'lodash';
import type { ImageAnnotatorProps } from '@labelu/image-annotator-react';
import type { ImageSample } from '@labelu/image-annotator-react/dist/context/sample.context';
import { omit } from 'lodash/fp';
import type { ToolName } from '@labelu/image';
import { TOOL_NAMES } from '@labelu/image';

import type { SampleResponse } from '@/api/types';

import { jsonParse } from './index';
import { generateDefaultValues } from './generateGlobalToolDefaultValues';

export function convertImageSample(
  sample: SampleResponse | undefined,
  preAnnotation: any,
  config: ImageAnnotatorProps['config'],
): ImageSample | undefined {
  if (!sample) {
    return;
  }

  const id = sample.id!;
  const url = sample.file.url;

  let resultParsed: any = {};
  if (sample?.data?.result && !_.isNull(sample?.data?.result)) {
    resultParsed = jsonParse(sample.data.result);
  }

  // pre annotation
  if (Object.keys(omit(['width', 'height', 'rotate'])(resultParsed)).length == 0 && preAnnotation) {
    resultParsed = _.get(preAnnotation, '[0].data[0].annotations');
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
        if (!resultParsed[key] && TOOL_NAMES.includes(type as ToolName)) {
          return;
        }

        const items = _.get(resultParsed, [key, 'result'], []);
        if (!items.length && (type === 'tag' || type === 'text')) {
          // 生成全局工具的默认值
          return [type, generateDefaultValues(config?.[type])];
        }

        return [
          type,
          items.map((item: any) => {
            const resultItem = {
              ...omit(['attribute'])(item),
              label: item.attribute ?? item.label,
            } as any;

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
