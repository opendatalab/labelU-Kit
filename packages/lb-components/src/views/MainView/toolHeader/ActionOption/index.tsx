import React, { FC } from 'react';
import { Switch } from 'antd';
import HeaderTips from '../HeaderTips'
import GeneralOperation from '../GeneralOperation'

const ActionOption: FC = () => {
  const onChange = (e: any) => {
    console.log(e);
  };


  return (
    <div className='lbc-left-sider'>
      <a>
        显示顺序 <Switch style={{marginLeft:"10px"}} defaultChecked onChange={onChange} />
      </a>
      <HeaderTips />
      <GeneralOperation />
    </div>
  );
};

export default ActionOption;
