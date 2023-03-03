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
import OutputData from '@/pages/outputData';
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
            loader: taskLoader,
            handle: {
              crumb: () => {
                return '任务配置';
              },
            },
            // children: [
            //   {
            //     path: 'basic',
            //     element: <InputInfoConfig />,
            //     handle: {
            //       crumb: () => {
            //         return '基本信息配置';
            //       },
            //     },
            //   },
            //   {
            //     path: 'upload',
            //     element: <InputData />,
            //     handle: {
            //       crumb: () => {
            //         return '数据导入';
            //       },
            //     },
            //   },
            //   {
            //     path: 'config',
            //     element: <AnnotationConfig />,
            //     handle: {
            //       crumb: () => {
            //         return '标注配置';
            //       },
            //     },
            //   },
            // ],
          },
          {
            path: 'samples',
            element: <Outlet />,
            loader: taskLoader,
            children: [
              {
                path: ':sampleId',
                element: <TaskAnnotation />,
                handle: {
                  crumb: () => {
                    return '开始标注';
                  },
                },
              },
              {
                path: 'finished',
                element: <TaskSamplesFinished />,
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
  {
    path: '/output',
    element: <OutputData />,
    handle: {
      crumb: () => {
        return '导出';
      },
    },
  },
];

export default routes;
