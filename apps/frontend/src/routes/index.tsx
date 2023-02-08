import type { FC } from 'react';
import type { RouteObject } from 'react-router';
import { useRoutes } from 'react-router-dom';

import AnnotationConfig from '../pages/annotationConfig';
import Login1 from '../pages/login1/index';
import SignUp from '../pages/signUp';
import Homepage from '../pages/homepage';
import TaskList from '../pages/taskList';
import CreateTask from '../pages/createTask';
import InputInfoConfig from '../pages/inputInfoConfig';
import InputData from '../pages/inputData';
import TaskAnnotation from '../pages/annotation2';
import Samples from '../pages/samples';
import RootGuard from '../pages/guards/rootGuard';
import TaskSamplesFinished from '../pages/sampleFinished';
import OutputData from '../pages/outputData';

const routeList: RouteObject[] = [
  {
    path: '/',
    element: <RootGuard />,
    children: [
      {
        path: 'tasks',
        element: <Homepage />,
        children: [
          {
            path: '',
            element: <TaskList />,
          },
        ],
      },
      {
        path: 'tasks/:taskId',
        element: <Homepage />,
        children: [
          {
            index: true,
            element: <Samples />,
          },
          {
            path: 'edit',
            element: <CreateTask />,
            children: [
              {
                path: 'basic',
                element: <InputInfoConfig />,
              },
              {
                path: 'upload',
                element: <InputData />,
              },
              {
                path: 'config',
                element: <AnnotationConfig />,
              },
            ],
          },
          {
            path: 'samples/:sampleId',
            element: <TaskAnnotation />,
          },
          {
            path: 'samples/finished',
            element: <TaskSamplesFinished />,
          },
        ],
      },
    ],
  },
  {
    path: 'login',
    element: <Login1 />,
  },
  {
    path: 'register',
    element: <SignUp />,
  },
  {
    path: 'output',
    element: <OutputData />,
  },
];

const RenderRouter: FC = () => {
  const element = useRoutes(routeList);
  return element;
};

export default RenderRouter;
