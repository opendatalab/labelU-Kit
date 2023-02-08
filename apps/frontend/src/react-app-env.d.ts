/// <reference types="react-scripts" />
/// <reference types="@emotion/react/types/css-prop" />
import type { AppState } from './stores';
declare module '@emotion/core/jsx-runtime';
declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: () => any;
}

declare interface ObjectConstructor {
  keys: <T>(o: T) => (keyof T)[];
}

declare module 'react-redux' {
  export type DefaultRootState = AppState;
}
