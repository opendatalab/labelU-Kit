import type { EnumerableAttribute, TextAttribute } from '@label-u/interface';
import { uid } from '@label-u/video-react';
import _ from 'lodash';

export function generateDefaultValues(attributes?: (TextAttribute | EnumerableAttribute)[]) {
  return _.map(attributes, (item) => {
    const defaultValues = [];

    if ((item as TextAttribute).type === 'string') {
      const stringItem = item as TextAttribute;

      return {
        id: uid(),
        type: 'text',
        value: {
          [stringItem.value]: stringItem.defaultValue,
        },
      };
    }

    const tagItem = item as EnumerableAttribute;

    for (let i = 0; i < tagItem.options.length; i++) {
      if (tagItem.options[i].isDefault) {
        defaultValues.push(tagItem.options[i].value);
      }
    }

    return {
      id: uid(),
      type: 'tag',
      value: {
        [tagItem.value]: defaultValues,
      },
    };
  });
}
