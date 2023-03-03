import { Spin } from 'antd';
import React from 'react';
import _ from 'lodash-es';
import DocumentTitle from 'react-document-title';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, useMatches } from 'react-router-dom';

import type { Match } from './components/Breadcrumb';
import routes from './routes';

export type RouteWithParent = RouteObject & {
  parent: RouteWithParent | null;
};

export interface RouteComponentProps {
  route: RouteWithParent;
}

// 将对应的面包屑信息添加到页面标题中
function RouteWithTitle({ children }: { children: React.ReactNode }) {
  const matches = useMatches() as Match[];
  const title = _.chain(matches)
    .filter((match) => Boolean(match.handle?.crumb))
    .map((match) => match.handle.crumb!(match.data))
    .last()
    .value();

  return (
    <DocumentTitle title={title ? `${title} - LabelU` : 'LabelU'}>
      {/* @ts-ignore */}
      {children}
    </DocumentTitle>
  );
}

function mapRoutes(
  inputRoutes: RouteObject[],
  parentPath: string = '',
  parentRoute: RouteWithParent | null = null,
): React.ReactNode {
  return inputRoutes.map((route) => {
    const { path, element, children, index, ...restProps } = route;
    const routeWithParent: RouteWithParent = { ...route, parent: parentRoute };

    const comp = <RouteWithTitle key={`${parentPath}-${path}`}>{element}</RouteWithTitle>;

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

const router = createBrowserRouter(createRoutesFromElements(mapRoutes(routes)));

export default function Router() {
  const fallback = <Spin style={{ width: '100vw', height: '100vh' }} spinning />;
  return <RouterProvider router={router} fallbackElement={fallback} />;
}
