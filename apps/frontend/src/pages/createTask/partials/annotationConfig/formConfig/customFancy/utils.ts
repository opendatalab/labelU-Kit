import { map, omit } from 'lodash/fp';
import { v4 as uuid4 } from 'uuid';

export function wrapWithId(item: any) {
  return {
    ...item,
    id: item.id || uuid4(),
  };
}

export const listOmitWithId = map(omit(['id']));

export const listWrapWithId = map(wrapWithId);
