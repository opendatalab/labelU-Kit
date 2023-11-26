import th from 'lodash.throttle';

export function throttle(wait = 0, opts: any = {}): MethodDecorator {
  return (proto: unknown, name: string | symbol, descriptor: PropertyDescriptor) => {
    if (!descriptor || typeof descriptor.value !== 'function') {
      throw new Error('debounce can only decorate functions');
    }
    const fn = descriptor.value;
    descriptor.value = th(fn, wait, opts);
    Object.defineProperty(proto, name, descriptor);
  };
}
