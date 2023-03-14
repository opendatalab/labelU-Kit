import * as formats from './formats';

type AllFormatters = typeof formats & Record<string, Formatter>;

const allFormatters: AllFormatters = {
  ...formats,
};

export interface Formatter<T = any, O = any> {
  type: string;
  name: string;
  desc?: string;
  format: (value: T, opts: O) => T | any;
}

function add<T extends Formatter<Parameters<T['format']>[0], Parameters<T['format']>[1]>>(formatter: T) {
  if (allFormatters[formatter.type]) {
    console.warn(`Formatter ${formatter.type} already exists.`);
    return;
  }

  allFormatters[formatter.type] = formatter;
}

function format<T extends Formatter['name']>(
  type: T,
  value: any,
  opts?: AllFormatters[T]['format'] extends (value: any, opts: infer O) => any ? O : any,
) {
  const formatter = allFormatters[type];
  if (!formatter) {
    console.error(`Formatter type: ${type} does not exist.`);
    return value;
  }

  // @ts-ignore
  return formatter.format(value, opts);
}

export default {
  add,
  format,
};
