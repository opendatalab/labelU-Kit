import { FancyBoolean } from './Boolean.fancy';
import { FancyEnum } from './Enum.fancy';
import { FancyAttributeList } from '../customFancy/ListAttribute.fancy';
import { FancyString } from './String.fancy';

export const inputs: Record<string, React.FC<any>> = {
  enum: FancyEnum,
  string: FancyString,
  boolean: FancyBoolean,
  'list-attribute': FancyAttributeList,
};

export function add(type: string) {
  if (inputs[type]) {
    console.warn(`[FancyInput] ${type} already exists`);
    return;
  }

  inputs[type] = FancyEnum;
}
