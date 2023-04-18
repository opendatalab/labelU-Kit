import type { store } from './store';
declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: () => any;
}

declare interface ObjectConstructor {
  keys: <T>(o: T) => (keyof T)[];
}

declare module 'react-redux' {
  export type DefaultRootState = typeof store;
}
