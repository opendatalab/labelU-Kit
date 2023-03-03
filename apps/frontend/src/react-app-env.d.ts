import type { AppState } from './stores';
declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: () => any;
}

declare interface ObjectConstructor {
  keys: <T>(o: T) => (keyof T)[];
}

declare module 'react-redux' {
  export type DefaultRootState = AppState;
}

declare module '*.svg' {
  import type * as React from 'react';

  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;

  export default ReactComponent;
}
