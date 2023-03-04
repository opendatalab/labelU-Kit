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
  // 有些页面不需要显示首页的标题
  hideHome?: boolean;
  style?: React.CSSProperties;
}

/**
 * 面包屑导航
 * 通过react-router-dom 的useMatches得到route的父子路径
 */
function Breadcrumb({ className, hideHome = false, style }: BreadcrumbProps) {
  const matches = useMatches() as Match[];

  const crumbs = matches
    .filter((match) => (match.pathname === '/' ? !hideHome : Boolean(match.handle?.crumb!(match.data))))
    .map((match) => ({
      ...match,
      crumb: match.handle.crumb!(match.data),
      pathname: match.pathname,
    }));

  return (
    // @ts-ignore
    <StyledBreadcrumb className={className} style={style}>
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
