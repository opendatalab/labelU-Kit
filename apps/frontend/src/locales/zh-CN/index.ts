import { zhCN_account } from './account';
import { zhCN_permissionRole } from './permission/role';
import LoginAndUp from './LoginAndUp';
const zh_CN = {
  ...zhCN_account,
  ...zhCN_permissionRole,
  ...LoginAndUp,
};

export default zh_CN;
