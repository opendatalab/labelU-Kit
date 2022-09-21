import { FC } from 'react';
// import GuideSvg from '../../assets/menu/guide.svg';
// import PermissionSvg from '../../assets/menu/permission.svg';
// import DashboardSvg from '../../assets/menu/dashboard.svg';
// import AccountSvg from '../../assets/menu/account.svg';
// import DocumentationSvg from '../../assets/menu/documentation.svg';
import SvgIcon from '../../components/basic/svgIcon';

interface CustomIconProps {
  type: string;
}

export const CustomIcon: FC<CustomIconProps> = props => {
  const { type } = props;
  let com = <SvgIcon name="menu-guide" />;

  if (type === 'guide') {
    com = <SvgIcon name="menu-guide" style={{ with: 20 }} />;
  } else if (type === 'permission') {
    com = <SvgIcon name="menu-permission" />;
  } else if (type === 'dashboard') {
    com = <SvgIcon name="menu-dashboard" />;
  } else if (type === 'account') {
    com = <SvgIcon name="menu-account" />;
  } else if (type === 'documentation') {
    com = <SvgIcon name="menu-documentation" />;
  } else {
    com = <SvgIcon name="menu-guide" />;
  }
  return <span className="anticon">{com}</span>;
};
