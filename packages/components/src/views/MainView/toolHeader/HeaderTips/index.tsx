import React from 'react';

import { prefix } from '@/constant';

import ToolHotKey from './ToolHotKey';

export const footerCls = `${prefix}-footer`;

const HeaderTips: React.FC = () => {
  return (
    <div className="tipsBar">
      <ToolHotKey />
    </div>
  );
};

export default HeaderTips;
