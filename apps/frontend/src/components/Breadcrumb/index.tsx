import { RightOutlined } from '@ant-design/icons';
import type { Params } from 'react-router-dom';
import { useMatches } from 'react-router-dom';

import StyledBreadcrumb, { BreadcrumbItem } from './styled';

export interface Match {
  id: string;
  pathname: string;
  params: Params<string>;
  data: unknown;
  handle: {
    crumb?: (data?: any) => React.ReactNode;
  };
}

export interface BreadcrumbProps {
  className?: string;
  // 有些页面不需要显示「数据管理」首页的字样，比如新建团队空间和空间设置
  hideHome?: boolean;
}

/**
 * 面包屑导航
 * 通过react-router-dom 的useMatches得到route的父子路径
 */
function Breadcrumb({ className, hideHome = false }: BreadcrumbProps) {
  const matches = useMatches() as Match[];

  const crumbs = matches
    .filter((match) => (match.pathname === '/tasks' ? !hideHome : Boolean(match.handle?.crumb)))
    .map((match) => ({
      ...match,
      crumb: match.handle.crumb!(match.data),
      pathname: match.pathname,
    }));

  return (
    // @ts-ignore
    <StyledBreadcrumb className={className}>
      {crumbs.map((item, index) => {
        const isCurrent = index === crumbs.length - 1;

        if (!isCurrent) {
          return (
            <div key={index} className="breadcrumb-item-wrap">
              <BreadcrumbItem to={item.pathname} isCurrent={false}>
                {item.crumb}
              </BreadcrumbItem>
              <RightOutlined className="breadcrumb-item-separator" />
            </div>
          );
        }

        return (
          <BreadcrumbItem as="span" isCurrent key={index}>
            {item.crumb}
          </BreadcrumbItem>
        );
      })}
    </StyledBreadcrumb>
  );
}

export default Breadcrumb;
