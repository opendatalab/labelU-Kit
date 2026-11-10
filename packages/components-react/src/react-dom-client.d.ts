// 本仓库的 @types/react-dom 版本较旧，缺少 react-dom/client 子路径的类型声明
declare module 'react-dom/client' {
  import type { ReactNode } from 'react';

  export interface Root {
    render: (children: ReactNode) => void;
    unmount: () => void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
}
