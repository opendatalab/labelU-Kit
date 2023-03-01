import { Spin } from 'antd';
import React from 'react';
import DocumentTitle from 'react-document-title';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';

import type { RouterItem } from './routes';
import routes from './routes';

export type RouteWithParent = RouterItem & {
  parent: RouteWithParent | null;
};

export interface RouteComponentProps {
  route: RouteWithParent;
}

function mapRoutes(
  inputRoutes: RouterItem[],
  parentPath: string = '',
  parentRoute: RouteWithParent | null = null,
): React.ReactNode {
  return inputRoutes.map((route) => {
    const { path, element, children, name, index, ...restProps } = route;
    const routeWithParent: RouteWithParent = { ...route, parent: parentRoute };
    const pageTitle = name ? `${name} - LabelU` : 'LabelU';

    const comp = (
      <DocumentTitle title={pageTitle} key={`${parentPath}-${path}`}>
        {/* @ts-ignore */}
        {element}
      </DocumentTitle>
    );

    if (index) {
      return (
        <Route
          index={Boolean(index)}
          key={`${parentPath}-${path}`}
          path={undefined}
          element={comp as React.ReactElement}
          {...restProps}
        />
      );
    }

    return (
      <Route key={`${parentPath}-${path}`} path={path} element={comp as React.ReactElement} {...restProps}>
        {Array.isArray(children) ? mapRoutes(children, path, routeWithParent) : null}
      </Route>
    );
  });
}

/**
 * NOTE: 任意非/api开头的路径后端（FastApi）会重定向到 根路径 「/」相关代码在labelu/internal/common/error_code.py@L110
 * 为了规避每次刷新都跳到/tasks的问题，这里使用hash路由
 */
const router = createBrowserRouter(createRoutesFromElements(mapRoutes(routes)));

export default function Router() {
  const fallback = <Spin style={{ width: '100vw', height: '100vh' }} spinning />;
  return <RouterProvider router={router} fallbackElement={fallback} />;
}
