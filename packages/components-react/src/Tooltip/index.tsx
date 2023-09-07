import RcTooltip from 'rc-tooltip';
import type { TooltipProps } from 'rc-tooltip/lib/Tooltip';

import GlobalStyle, { tooltipPrefix } from './GlobalStyle';

export function Tooltip(props: TooltipProps) {
  return (
    <>
      <GlobalStyle />
      <RcTooltip prefixCls={tooltipPrefix} {...props} />
    </>
  );
}
