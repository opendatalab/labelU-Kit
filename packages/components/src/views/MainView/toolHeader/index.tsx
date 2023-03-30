import classNames from 'classnames';
import React, { useContext, useRef } from 'react';

import { prefix } from '@/constant';
import ViewContext from '@/view.context';

import HeaderOption from './headerOption';
import ActionOption from './ActionOption';
import ToolOperation from './ToolOperation';

const ToolHeader = () => {
  const { topActionContent } = useContext(ViewContext);
  const ref = useRef(null);

  const headerOptionNode = <HeaderOption />;
  const NextImageOption = <div className="nextImageOption">{topActionContent}</div>;

  return (
    <div className={classNames(`${prefix}-header`)} ref={ref}>
      <div className={`${prefix}-header__title`}>
        <ToolOperation />
        <div id="operationNode" className={`${prefix}-header__operationNode`}>
          {headerOptionNode}
        </div>
        <ActionOption />
        {NextImageOption}
      </div>
    </div>
  );
};

export default ToolHeader;
