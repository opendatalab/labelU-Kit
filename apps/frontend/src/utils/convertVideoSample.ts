import _ from 'lodash';
import type { VideoSample } from '@label-u/video-editor-react/dist/Editor/context';

import type { SampleData } from '@/services/types';

import { jsonParse } from '.';

export function convertVideoSample(
  sample: SampleData | undefined,
  sampleId: string | number | undefined,
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
  // delete
  let resultParsed: any = {};
  if (sample.result && !_.isNull(sample.result)) {
    resultParsed = jsonParse(sample.result);
  }

  // annotation
  const pool = [
    ['segment', 'videoSegmentTool'],
    ['frame', 'videoFrameTool'],
    ['text', 'textTool'],
    ['tag', 'tagTool'],
  ];

  return {
    id,
    url: url.replace('attachment', 'partial'),
    annotations: _.chain(pool)
      .map(([type, key]) => {
        const items = _.get(resultParsed, key, []);
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
