import { enUS_account } from './account';
import { enUS_permissionRole } from './permission/role';
import LoginAndUp from './LoginAndUp';

const en_US = {
  ...enUS_account,
  ...enUS_permissionRole,
  ...LoginAndUp,
};

export default en_US;
