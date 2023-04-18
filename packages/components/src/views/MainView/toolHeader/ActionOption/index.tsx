import type { FC } from 'react';
import { useContext } from 'react';
import { Switch } from 'antd';

import ViewContext from '@/view.context';

import HeaderTips from '../HeaderTips';

const ActionOption: FC = () => {
  const { isShowOrder, setIsShowOrder } = useContext(ViewContext);
  const onChange = (e: boolean) => {
    setIsShowOrder(e);
  };

  return (
    <div className="lbc-left-sider">
      <a>
        显示顺序 <Switch style={{ marginLeft: '10px' }} checked={isShowOrder} onChange={onChange} />
      </a>
      <HeaderTips />
    </div>
  );
};

export default ActionOption;
