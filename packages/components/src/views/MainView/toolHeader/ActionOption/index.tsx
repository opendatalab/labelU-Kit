import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Switch } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { UpdateIsShowOrder } from '@/store/annotation/actionCreators';
import type { AppState } from '@/store';

import GeneralOperation from '../GeneralOperation';
import HeaderTips from '../HeaderTips';

const ActionOption: FC = () => {
  const dispatch = useDispatch();
  const [defaultChecked, setDefaultChecked] = useState<boolean>();
  const onChange = (e: any) => {
    dispatch(UpdateIsShowOrder(e));
  };

  const { isShowOrder } = useSelector((state: AppState) => state.annotation);

  useEffect(() => {
    setDefaultChecked(isShowOrder);
  }, [isShowOrder]);

  return (
    <div className="lbc-left-sider">
      <a>
        显示顺序 <Switch style={{ marginLeft: '10px' }} checked={defaultChecked} onChange={onChange} />
      </a>
      <GeneralOperation />
      <HeaderTips />
    </div>
  );
};

export default ActionOption;
