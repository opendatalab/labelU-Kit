import { FancyBoolean } from './Boolean.fancy';
import { FancyEnum } from './Enum.fancy';
import { FancyAttributeList } from '../customFancy/ListAttribute.fancy';
import { FancyString } from './String.fancy';
import { FancyNumber } from './Number.fancy';
import { FancyCategoryAttribute } from '../customFancy/CategoryAttribute.fancy';

export const inputs: Record<string, React.FC<any>> = {
  enum: FancyEnum,
  string: FancyString,
  number: FancyNumber,
  boolean: FancyBoolean,
  'list-attribute': FancyAttributeList,
  'category-attribute': FancyCategoryAttribute,
};

export function add(type: string) {
  if (inputs[type]) {
    console.warn(`[FancyInput] ${type} already exists`);
    return;
  }

  inputs[type] = FancyEnum;
}
