import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router';
import { redirect } from 'react-router-dom';

import Login from '@/pages/login/index';
import SignUp from '@/pages/signUp';
import TaskList from '@/pages/taskList';
import CreateTask from '@/pages/createTask';
import TaskAnnotation from '@/pages/annotation';
import Samples from '@/pages/samples';
import TaskSamplesFinished from '@/pages/sampleFinished';
import type { TaskResponse } from '@/services/types';
import MainLayout from '@/layouts/MainLayoutWithNavigation';

import { taskLoader } from './loaders';

const routes: RouteObject[] = [
  {
    path: '/',
    handle: {
      crumb: () => {
        return '首页';
      },
    },
    element: <Outlet />,
    loader: async () => {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      if (!token || !username) {
        return redirect('/login');
      }

      return redirect('/tasks');
    },
  },
  {
    path: '/tasks',
    element: <MainLayout />,
    handle: {
      crumb: () => {
        return '任务列表';
      },
    },
    children: [
      {
        index: true,
        element: <TaskList />,
      },
      {
        path: ':taskId',
        id: 'task',
        element: <Outlet />,
        loader: taskLoader,
        handle: {
          crumb: (data: TaskResponse) => {
            return data?.name;
          },
        },
        children: [
          {
            index: true,
            element: <Samples />,
          },
          {
            path: 'edit',
            element: <CreateTask />,
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
            element: <Outlet />,
            children: [
              {
                path: ':sampleId',
                element: <TaskAnnotation />,
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
    path: '/register',
    element: <SignUp />,
    handle: {
      crumb: () => {
        return '注册';
      },
    },
  },
];

export default routes;
