import React from 'react';
import ToolHotKey from './ToolHotKey';
import { useSelector } from '@/store/ctx';
import { prefix } from '@/constant';
import { AppState } from '@/store';

export const footerCls = `${prefix}-footer`;

const HeaderTips: React.FC = () => {
  const { currentToolName } = useSelector((state: AppState) => ({
    currentToolName: state.annotation.currentToolName,
  }));

  return (
    <div className='tipsBar'>
      <ToolHotKey toolName={currentToolName} />
    </div>
  );
};

export default HeaderTips;
