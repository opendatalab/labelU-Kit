import _ from 'lodash';
import type { VideoSample } from '@labelu/video-annotator-react/dist/Editor/context';
import type { EditorProps } from '@labelu/video-annotator-react';
import { omit } from 'lodash/fp';

import type { PreAnnotationType, SampleResponse } from '@/api/types';
import { MediaType } from '@/api/types';

import { jsonParse } from './index';
import { generateDefaultValues } from './generateGlobalToolDefaultValues';

export function convertVideoSample(
  sample: SampleResponse,
  preAnnotations: PreAnnotationType[] | undefined,
  config: EditorProps['config'],
  mediaType?: MediaType,
): VideoSample | undefined {
  if (!sample) {
    return;
  }

  const id = sample.id!;

  let resultParsed: any = {};
  if (sample?.data?.result && !_.isNull(sample?.data?.result)) {
    resultParsed = jsonParse(sample.data.result);
  }

  // pre annotation
  if (Object.keys(omit(['width', 'height', 'rotate'])(resultParsed)).length == 0 && preAnnotations) {
    resultParsed = _.get(preAnnotations, '[0].data[0].annotations', {});
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
    url: mediaType === MediaType.VIDEO ? sample.file.url.replace('attachment', 'partial') : sample.file.url,
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
