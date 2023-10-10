import _ from 'lodash';
import type { VideoSample } from '@label-u/video-annotator-react/dist/Editor/context';
import type { EditorProps } from '@label-u/video-annotator-react';

import type { SampleData } from '@/services/types';
import { MediaType } from '@/services/types';

import { jsonParse } from './index';
import { generateDefaultValues } from './generateGlobalToolDefaultValues';

export function convertVideoSample(
  sample: SampleData | undefined,
  sampleId: string | number | undefined,
  config: EditorProps['config'],
  mediaType?: MediaType,
): VideoSample | undefined {
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
    ['segment', MediaType.VIDEO === mediaType ? 'videoSegmentTool' : 'audioSegmentTool'],
    ['frame', MediaType.VIDEO === mediaType ? 'videoFrameTool' : 'audioFrameTool'],
    ['text', 'textTool'],
    ['tag', 'tagTool'],
  ];

  return {
    id,
    url: mediaType === MediaType.VIDEO ? url.replace('attachment', 'partial') : url,
    annotations: _.chain(pool)
      .map(([type, key]) => {
        const items = _.get(resultParsed, [key, 'result'], []);
        if (!items.length && (type === 'tag' || type === 'text')) {
          // 生成全局工具的默认值
          return generateDefaultValues(config?.[type]);
        }

        return _.map(items, (item) => {
          return {
            ...item,
            type,
          };
        });
      })
      .flatten()
      .value(),
  };
}
