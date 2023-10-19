import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router';

import Login from '@/pages/login/index';
import Register from '@/pages/register';
import Tasks from '@/pages/tasks';
import TaskEdit from '@/pages/tasks.[id].edit';
import TaskAnnotation from '@/pages/tasks.[id].samples.[id]';
import Samples from '@/pages/tasks.[id]';
import TaskSamplesFinished from '@/pages/tasks.[id].samples.finished';
import Page404 from '@/pages/404';
import MainLayout from '@/layouts/MainLayoutWithNavigation';

import type { TaskLoaderResult } from './loaders/task.loader';
import { taskLoader, tasksLoader } from './loaders/task.loader';
import { rootLoader } from './loaders/root.loader';
import { sampleLoader } from './loaders/sample.loader';

const routes: RouteObject[] = [
  {
    path: '/',
    handle: {
      crumb: () => {
        return '首页';
      },
    },
    id: 'root',
    element: <Outlet />,
    loader: rootLoader,
  },
  {
    path: '/tasks',
    element: <MainLayout />,
    errorElement: <Page404 />,
    id: 'tasks',
    loader: tasksLoader,
    handle: {
      crumb: () => {
        return '任务列表';
      },
    },
    children: [
      {
        index: true,
        element: <Tasks />,
      },
      {
        path: ':taskId',
        id: 'task',
        element: <Outlet />,
        loader: taskLoader,
        handle: {
          crumb: (data: TaskLoaderResult) => {
            return data?.task?.name;
          },
        },
        children: [
          {
            index: true,
            element: <Samples />,
          },
          {
            path: 'edit',
            element: <TaskEdit />,
            loader: async ({ params }) => {
              return params.taskId !== '0' ? '任务编辑' : '新建任务';
            },
            handle: {
              crumb: (data: string) => {
                return data;
              },
            },
          },
          {
            path: 'samples',
            id: 'samples',
            element: <Outlet />,
            children: [
              {
                path: ':sampleId',
                element: <TaskAnnotation />,
                loader: sampleLoader,
                id: 'annotation',
                handle: {
                  crumb: () => {
                    return '开始标注';
                  },
                },
              },
              {
                path: 'finished',
                element: <TaskSamplesFinished />,
                loader: taskLoader,
                handle: {
                  crumb: () => {
                    return '标注结束';
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'login',
    element: <Login />,
  },
  {
    path: 'register',
    element: <Register />,
    handle: {
      crumb: () => {
        return '注册';
      },
    },
  },
  {
    path: '*',
    element: <Page404 />,
  },
];

export default routes;
