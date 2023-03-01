import type { LoaderFunction, RouteObject } from 'react-router';
import { Outlet } from 'react-router';
import { redirect } from 'react-router-dom';

import { getTask } from '@/services/samples';

import AnnotationConfig from '../pages/annotationConfig';
import Login1 from '../pages/login/index';
import SignUp from '../pages/signUp';
import Homepage from '../pages/homepage';
import TaskList from '../pages/taskList';
import CreateTask from '../pages/createTask';
import InputInfoConfig from '../pages/inputInfoConfig';
import InputData from '../pages/inputData';
import TaskAnnotation from '../pages/annotation';
import Samples from '../pages/samples';
import TaskSamplesFinished from '../pages/sampleFinished';
import OutputData from '../pages/outputData';

export type RouterItem = RouteObject & {
  name?: string;
  children?: RouterItem[];
};

const taskLoader: LoaderFunction = async ({ params }) => {
  if (!params?.taskId) {
    return null;
  }

  const taskData = await getTask(+params.taskId);

  return taskData.data.data;
};

const routes: RouterItem[] = [
  {
    path: '/',
    name: '首页',
    handle: {
      crumb: () => {
        return '首页';
      },
    },
    element: <Homepage />,
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
    name: '任务列表',
    path: '/tasks',
    element: <Homepage />,
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
        element: <Outlet />,
        loader: taskLoader,
        children: [
          {
            name: '样本列表',
            index: true,
            element: <Samples />,
            loader: taskLoader,
            handle: {
              crumb: () => {
                return '样本列表';
              },
            },
          },
          {
            path: 'edit',
            name: '任务配置',
            element: <CreateTask />,
            handle: {
              crumb: () => {
                return '任务配置';
              },
            },
            children: [
              {
                path: 'basic',
                // @ts-ignore
                name: '基本信息配置',
                element: <InputInfoConfig />,
              },
              {
                path: 'upload',
                name: '数据导入',
                element: <InputData />,
              },
              {
                path: 'config',
                name: '标注配置',
                element: <AnnotationConfig />,
              },
            ],
          },
          {
            path: 'samples',
            name: '样本',
            element: <Outlet />,
            children: [
              {
                path: ':sampleId',
                // @ts-ignore
                name: '标注',
                element: <TaskAnnotation />,
              },
              {
                path: 'finished',
                name: '标注结束',
                element: <TaskSamplesFinished />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/login',
    name: '登录',
    element: <Login1 />,
  },
  {
    path: '/register',
    name: '注册',
    element: <SignUp />,
  },
  {
    path: '/output',
    name: '导出',
    element: <OutputData />,
  },
];

export default routes;
