import { MenuList } from '../../interface/layout/menu.interface';
import { mock, intercepter } from '../config';

const mockMenuList: MenuList = [
  {
    name: 'annotationConfig',
    label: {
      zh_CN: '标注工具配置',
      en_US: 'annotationConfig'
    },
    icon: 'dashboard',
    key: '0',
    path: '/annotationConfig'
  },
  {
    name: 'annotation',
    label: {
      zh_CN: '图像标注工具',
      en_US: 'annotation'
    },
    icon: 'annotation',
    key: '0',
    path: '/annotation'
  },
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
