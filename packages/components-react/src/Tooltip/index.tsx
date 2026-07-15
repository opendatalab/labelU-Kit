import RcTooltip from 'rc-tooltip';
import type { TooltipProps } from 'rc-tooltip/lib/Tooltip';
import { createRoot } from 'react-dom/client';

import GlobalStyle, { tooltipPrefix } from './GlobalStyle';

let styleInjected = false;

/**
 * 全局样式只注入一次，挂在常驻的独立 React root 上，与 Tooltip 实例的挂载/卸载解耦。
 *
 * createGlobalStyle 会为每个挂载的实例把全部规则重新插入样式表；
 * 页面上有上百个 Tooltip（每个标签、每条标注各一个）时，重复注入的代价是
 * O(实例数 × 规则数) 次样式表 DOM 操作，实测会造成数秒级的主线程阻塞。
 */
function ensureGlobalStyle() {
  if (styleInjected || typeof document === 'undefined') {
    return;
  }

  styleInjected = true;
  createRoot(document.createElement('div')).render(<GlobalStyle />);
}

export function Tooltip(props: TooltipProps) {
  ensureGlobalStyle();

  return <RcTooltip prefixCls={tooltipPrefix} {...props} />;
}
