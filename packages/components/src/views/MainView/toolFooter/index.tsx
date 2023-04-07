import { Input } from 'antd/es';
import { useEffect, useRef, useState } from 'react';

import { prefix } from '@/constant';

import FooterTips from './FooterTips';
import FooterOption from './FooterOption';

interface IPageProps {
  jumpSkip: Function;
  imgIndex: number;
}

export const PageInput = (props: IPageProps) => {
  const { jumpSkip, imgIndex } = props;
  const [newIndex, setIndex] = useState(imgIndex);
  const inputEl = useRef(null);

  useEffect(() => {
    setIndex(imgIndex + 1);
  }, [imgIndex]);

  const newHandleJump = (e: any) => {
    const reg = /^\d*$/;
    if (reg.test(e.target.value)) {
      setIndex(e.target.value);
    }
  };

  const newJumpSkip = (e: any) => {
    if (e.keyCode === 13) {
      jumpSkip(e.target.value);
      // inputEl?.current?.blur();
    }
  };

  return (
    <Input className="pageInput" ref={inputEl} onChange={newHandleJump} value={newIndex} onKeyDown={newJumpSkip} />
  );
};

export const footerCls = `${prefix}-footer`;

const ToolFooter = () => {
  const footerTips = <FooterTips />;

  const footerOption = <FooterOption />;

  return (
    <div className={`${footerCls}`} style={{ paddingRight: 20 }}>
      {footerTips}
      <div style={{ flex: 1 }} />
      {footerOption}
    </div>
  );
};

export default ToolFooter;
