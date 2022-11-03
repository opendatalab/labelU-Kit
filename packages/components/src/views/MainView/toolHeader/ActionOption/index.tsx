import React, { FC, useEffect, useState } from 'react';
import { Switch } from 'antd';
import HeaderTips from '../HeaderTips'
import GeneralOperation from '../GeneralOperation'
import { useDispatch, useSelector } from '@/store/ctx';
import { UpdateIsShowOrder } from '@/store/annotation/actionCreators';
import { AppState } from '@/store';

const ActionOption: FC = () => {
  const dispatch = useDispatch()
  const [defaultChecked,setDefaultChecked] = useState<boolean>()
  const onChange = (e: any) => {
    dispatch(UpdateIsShowOrder(e))
  };

  const {isShowOrder} = useSelector((state:AppState)=>state.annotation)

  useEffect(()=>{
    setDefaultChecked(isShowOrder)
  },[isShowOrder])

  return (
    <div className='lbc-left-sider'>
      <a>
        显示顺序 <Switch style={{marginLeft:"10px"}} checked={defaultChecked} onChange={onChange} />
      </a>
      <GeneralOperation />
      <HeaderTips />
    </div>
  );
};

export default ActionOption;
