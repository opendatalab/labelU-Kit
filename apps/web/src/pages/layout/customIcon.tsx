import { FC } from 'react';
import GuideSvg from '../../img/menu/guide.svg';
import PermissionSvg from '../../img/menu/permission.svg';
import DashboardSvg from '../../img/menu/dashboard.svg';
import AccountSvg from '../../img/menu/account.svg';
import DocumentationSvg from '../../img/menu/documentation.svg';
// import SvgIcon from '../../components/basic/svgIcon';

interface CustomIconProps {
  type: string;
}

export const CustomIcon: FC<CustomIconProps> = props => {
  const { type } = props;
  let com = <img alt="menu-guide" src={GuideSvg} />;

  if (type === 'guide') {
    com = <img src={GuideSvg} alt="menu-guide" style={{ width: 20 }} />;
  } else if (type === 'permission') {
    com = <img alt="menu-permission" src={PermissionSvg} />;
  } else if (type === 'dashboard') {
    com = <img alt="menu-dashboard" src={DashboardSvg} />;
  } else if (type === 'account') {
    com = <img alt="menu-account" src={AccountSvg} />;
  } else if (type === 'documentation') {
    com = <img alt="menu-documentation" src={DocumentationSvg} />;
  } else {
    com = <img alt="menu-guide" src={GuideSvg} />;
  }
  return <span className="anticon">{com}</span>;
};
