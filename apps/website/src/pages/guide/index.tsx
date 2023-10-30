import { FlexLayout } from '@labelu/components-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import clsx from 'clsx';

const menus = [
  {
    title: '开始',
    path: '/guide',
  },
  {
    title: '图像',
    children: [
      {
        title: '标点',
        path: '/guide/image',
        hash: '#point',
      },
      {
        title: '标线',
        path: '/guide/image',
        hash: '#line',
      },
      {
        title: '拉框',
        path: '/guide/image',
        hash: '#rect',
      },
      {
        title: '多边形',
        path: '/guide/image',
        hash: '#polygon',
      },
      // TODO
      // {
      //   title: '立体框',
      //   path: '/guide/image',
      //   hash: '#cuboid',
      // },
    ],
  },
  // TODO
  // {
  //   title: '文本',
  //   path: '/guide/text',
  // },
  {
    title: '音频',
    path: '/guide/audio',
  },
  {
    title: '视频',
    path: '/guide/video',
  },
  // TODO
  // {
  //   title: '点云',
  //   path: '/guide/point-cloud',
  // },
];

export default function Guide() {
  const location = useLocation();

  return (
    <FlexLayout full>
      <FlexLayout.Item>
        <ul className="menu text-base h-full rounded-r-lg lg:w-[280px]">
          {menus.map(({ title, children, path }) => {
            if (children) {
              return (
                <li key={title}>
                  <details open>
                    <summary className="rounded-full pl-6">{title}</summary>
                    <ul>
                      {children.map(({ title: childrenTitle, path: subPath, hash }) => (
                        <li key={hash}>
                          <Link
                            className={clsx('rounded-full pl-6', {
                              'bg-base-200': location.hash === hash,
                            })}
                            to={`${subPath}${hash}`}
                          >
                            {childrenTitle}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            }
            return (
              <li key={path}>
                <Link
                  className={clsx('rounded-full pl-6', {
                    'bg-base-200': location.pathname === path,
                  })}
                  to={path}
                >
                  {title}
                </Link>
              </li>
            );
          })}
        </ul>
      </FlexLayout.Item>
      <FlexLayout.Content>
        <FlexLayout.Content className="prose prose-slate py-2 px-6">
          <MDXProvider>
            <Outlet />
          </MDXProvider>
        </FlexLayout.Content>
      </FlexLayout.Content>
    </FlexLayout>
  );
}
