import { lazy, FC } from 'react';
import LoginPage from '../pages/login';
import LayoutPage from '../pages/layout';
import { RouteObject } from 'react-router';
import WrapperRouteComponent from './config';
import { useRoutes } from 'react-router-dom';
import AnnotationPage from '../pages/annotation';
import AnnotationConfig from '../pages/annotationConfig';
import PointCloud from '../pages/pointCloud';
const NotFound = lazy(() => import(/* webpackChunkName: "404'"*/ '../pages/404'));

const routeList: RouteObject[] = [
  {
    path: '/login',
    element: <WrapperRouteComponent element={<LoginPage />} titleId="title.login" />
  },
  {
    path: '/annotation',
    element: <WrapperRouteComponent element={<AnnotationPage />} titleId="title.annotation" />
  },
  {
    path: '/pointCloud',
    element: <WrapperRouteComponent element={<PointCloud />} titleId="title.pointCloud" />
  },
  {
    path: '/annotationConfig',
    element: <WrapperRouteComponent element={<AnnotationConfig />} titleId="title.annotationConfig" />
  },
  {
    path: '/',
    element: <WrapperRouteComponent element={<LayoutPage />} titleId="" />,
    children: [
      {
        path: '*',
        element: <WrapperRouteComponent element={<NotFound />} titleId="title.notFount" />
      }
    ]
  }
];

const RenderRouter: FC = () => {
  const element = useRoutes(routeList);
  return element;
};

export default RenderRouter;
