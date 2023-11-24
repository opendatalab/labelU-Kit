import type { ThrottleOptions } from '../utils';
import { debounce as db } from '../utils';

export function debounce(wait = 0, opts: ThrottleOptions = {}): MethodDecorator {
  return (proto: unknown, name: string | symbol, descriptor: PropertyDescriptor) => {
    if (!descriptor || typeof descriptor.value !== 'function') {
      throw new Error('debounce can only decorate functions');
    }
    const fn = descriptor.value;
    descriptor.value = db(fn, wait, opts);
    Object.defineProperty(proto, name, descriptor);
  };
}
