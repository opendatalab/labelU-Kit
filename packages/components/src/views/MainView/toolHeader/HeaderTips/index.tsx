import React from 'react';
import { useSelector } from 'react-redux';

import { prefix } from '@/constant';

import ToolHotKey from './ToolHotKey';
import StepUtils from '../../../../utils/StepUtils';

export const footerCls = `${prefix}-footer`;

const HeaderTips: React.FC = () => {
  // @ts-ignore
  const stepInfo = useSelector((state) =>
    // @ts-ignore
    StepUtils.getCurrentStepInfo(state?.annotation?.step, state.annotation?.stepList),
  );

  return (
    <div className="tipsBar">
      <ToolHotKey toolName={stepInfo?.tool} />
    </div>
  );
};

export default HeaderTips;
