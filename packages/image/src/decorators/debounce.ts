import db from 'lodash.debounce';

export function debounce(wait = 0, opts: any = {}): MethodDecorator {
  return (proto: unknown, name: string | symbol, descriptor: PropertyDescriptor) => {
    if (!descriptor || typeof descriptor.value !== 'function') {
      throw new Error('debounce can only decorate functions');
    }
    const fn = descriptor.value;
    descriptor.value = db(fn, wait, opts);
    Object.defineProperty(proto, name, descriptor);
  };
}
