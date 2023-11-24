import type { ThrottleOptions } from '../utils';
import { throttle as th } from '../utils';

export function throttle(wait = 0, opts: ThrottleOptions = {}): MethodDecorator {
  return (proto: unknown, name: string | symbol, descriptor: PropertyDescriptor) => {
    if (!descriptor || typeof descriptor.value !== 'function') {
      throw new Error('debounce can only decorate functions');
    }
    const fn = descriptor.value;
    descriptor.value = th(fn, wait, opts);
    Object.defineProperty(proto, name, descriptor);
  };
}
