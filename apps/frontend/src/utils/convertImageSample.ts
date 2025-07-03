import _ from 'lodash';
import type { ImageSample } from '@labelu/image-annotator-react';
import { omit } from 'lodash/fp';
import type { ToolName } from '@labelu/image';
import { TOOL_NAMES } from '@labelu/image';

import type { ParsedResult, SampleResponse } from '@/api/types';

import { jsonParse } from './index';

export function convertImageAnnotations(result: ParsedResult) {
  // annotation
  const pool = [
    ['line', 'lineTool'],
    ['point', 'pointTool'],
    ['rect', 'rectTool'],
    ['polygon', 'polygonTool'],
    ['cuboid', 'cuboidTool'],
    ['relation', 'relationTool'],
    ['text', 'textTool'],
    ['tag', 'tagTool'],
  ] as const;

  return _.chain(pool)
    .map(([type, key]) => {
      if (!result[key] && TOOL_NAMES.includes(type as ToolName)) {
        return;
      }

      const items = _.get(result, [key, 'result']) || _.get(result, [type, 'result'], []);

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
    .value();
}

export function convertImageSample(sample: SampleResponse | undefined): ImageSample | undefined {
  if (!sample) {
    return;
  }

  const id = sample.id!;
  const url = sample.file.url;

  let resultParsed: any = {};
  if (sample?.data?.result && !_.isNull(sample?.data?.result)) {
    resultParsed = jsonParse(sample.data.result);
  }

  return {
    id,
    url,
    data: convertImageAnnotations(resultParsed),
    meta: _.pick(resultParsed, ['width', 'height', 'rotate']),
  };
}
