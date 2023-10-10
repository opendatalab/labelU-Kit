import { cloneElement, useLayoutEffect, useRef, useState } from 'react';
import type { TooltipProps } from 'rc-tooltip/lib/Tooltip';

import { Tooltip } from '../Tooltip';

export function EllipsisText({
  children,
  title = '',
  maxWidth,
  ...restProps
}: {
  children: React.ReactNode;
  title: React.ReactNode | (() => React.ReactNode);
  maxWidth: number;
} & Omit<TooltipProps, 'overlay'>) {
  const [overflow, setOverflow] = useState(false);
  const [isEnter, setIsEnter] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current && ref.current.clientWidth >= maxWidth) {
      setOverflow(true);
    }
  }, [isEnter, maxWidth]);

  const newChildren = cloneElement(
    typeof children === 'string' ? <span>{children}</span> : (children as NonNullable<any>),
    {
      ref,
      style: {
        maxWidth: typeof maxWidth === 'string' ? maxWidth : `${maxWidth}px`,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      // 当元素初始隐藏时，无法获得其宽度，因此需要在鼠标进入时重新计算
      onMouseEnter: () => {
        setIsEnter(true);
      },
    },
  );

  const overlayStyle: React.CSSProperties = {};

  if (!overflow) {
    overlayStyle.display = 'none';
  }

  return (
    // @ts-ignore
    <Tooltip overlay={title} placement="top" overlayStyle={overlayStyle} {...restProps}>
      {newChildren as NonNullable<any>}
    </Tooltip>
  );
}
