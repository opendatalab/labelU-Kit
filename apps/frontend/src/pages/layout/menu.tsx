import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import type { MenuList } from '../../types/layout/menu.interface';
import { CustomIcon } from './customIcon';
import { setUserItem } from '../../stores/user.store';

const { SubMenu, Item } = Menu;

interface MenuProps {
  menuList: MenuList;
}

const MenuComponent: FC<MenuProps> = ({ menuList }) => {
  const [openKeys, setOpenkeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  // @ts-ignore
  const { collapsed, device, locale } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const getTitie = (menu: MenuList[0]) => {
    return (
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <CustomIcon type={menu.icon!} />
        {/* @ts-ignore */}
        <span>{menu.label[locale]}</span>
      </span>
    );
  };

  const onMenuClick = (menu: MenuList[0]) => {
    if (menu.path === pathname) return;
    const { key, path } = menu;
    setSelectedKeys([key]);
    if (device !== 'DESKTOP') {
      dispatch(setUserItem({ collapsed: true }));
    }
    navigate(path);
  };

  useEffect(() => {
    setSelectedKeys([pathname]);
    setOpenkeys(collapsed ? [] : ['/' + pathname.split('/')[1]]);
  }, [collapsed, pathname]);

  const onOpenChange = (keys: string[]) => {
    const key = keys.pop();

    setOpenkeys(key ? [key] : []);
  };

  return (
    <Menu
      mode="inline"
      theme="light"
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={onOpenChange as any}
      className="layout-page-sider-menu"
    >
      {menuList?.map((menu) =>
        menu.children ? (
          <SubMenu key={menu.path} title={getTitie(menu)}>
            {menu.children.map((child) => (
              <Item key={child.path} onClick={() => onMenuClick(child)}>
                {/* @ts-ignore */}
                {child.label[locale]}
              </Item>
            ))}
          </SubMenu>
        ) : (
          <Item key={menu.path} onClick={() => onMenuClick(menu)}>
            {getTitie(menu)}
          </Item>
        ),
      )}
    </Menu>
  );
};

export default MenuComponent;
