import { cloneElement, useLayoutEffect, useRef, useState } from 'react';
import type { TooltipProps } from 'rc-tooltip/lib/Tooltip';

import { Tooltip } from '../Tooltip';

export function EllipsisText({
  children,
  title = '',
  maxWidth,
  ...restProps
}: React.PropsWithChildren<
  {
    title: React.ReactNode;
    maxWidth: number;
  } & Omit<TooltipProps, 'overlay'>
>) {
  const [overflow, setOverflow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current && ref.current.clientWidth >= maxWidth) {
      setOverflow(true);
    }
  }, [maxWidth]);

  if (!children) {
    return null;
  }

  const newChildren = cloneElement(children as NonNullable<any>, {
    ref,
    style: {
      maxWidth: `${maxWidth}px`,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  });

  const overlayStyle: React.CSSProperties = {};

  if (!overflow) {
    overlayStyle.display = 'none';
  }

  return (
    <Tooltip overlay={title} placement="top" overlayStyle={overlayStyle} {...restProps}>
      {newChildren as NonNullable<any>}
    </Tooltip>
  );
}
