import { lazy, FC } from 'react';
import LayoutPage from '../pages/layout';
import { RouteObject } from 'react-router';
import WrapperRouteComponent from './config';
import { useRoutes } from 'react-router-dom';
// import AnnotationPage from '../pages/annotation';
// import AnnotationConfig from '../pages/annotationConfig';
import PointCloud from '../pages/pointCloud';
const NotFound = lazy(() => import(/* webpackChunkName: "404'"*/ '../pages/404'));

const routeList: RouteObject[] = [
  {
    path: '/pointCloud',
    element: <WrapperRouteComponent element={<PointCloud />} titleId="title.pointCloud" />
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
