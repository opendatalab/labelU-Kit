import type { RouteObject } from 'react-router';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useEffect } from 'react';

import Tasks from '@/pages/tasks';
import TaskEdit from '@/pages/tasks.[id].edit';
import TaskAnnotation from '@/pages/tasks.[id].samples.[id]';
import Samples from '@/pages/tasks.[id]';
import TaskSamplesFinished from '@/pages/tasks.[id].samples.finished';
import Page404 from '@/pages/404';
import type { TaskResponse } from '@/services/types';
import MainLayout from '@/layouts/MainLayoutWithNavigation';

import { taskLoader } from './loaders/task.loader';
import { ssoLoader } from './loaders/sso.loader';
import RequireAuth from './components/RequireSSO';

function Root() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 如果是根路径，跳转到任务管理（以任务管理为首页）
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/tasks');
    }
  }, [location.pathname, navigate]);

  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}

const routes: RouteObject[] = [
  {
    path: '/',
    id: 'root',
    handle: {
      crumb: () => {
        return '首页';
      },
    },
    element: <Root />,
    loader: ssoLoader,
    children: [
      {
        path: 'tasks',
        element: <MainLayout />,
        errorElement: <Page404 />,
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
    ],
  },
  {
    path: '*',
    element: <Page404 />,
  },
];

export default routes;
