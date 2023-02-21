import { MenuList } from '../../interface/layout/menu.interface';
import { mock, intercepter } from '../config';

const mockMenuList: MenuList = [
  {
    name: 'pointCloud',
    label: {
      zh_CN: '点云标注工具',
      en_US: 'pointCloud'
    },
    icon: 'permission',
    key: '0',
    path: '/pointCloud'
  }
];

mock.mock('/user/menu', 'get', intercepter(mockMenuList));
