import { TOOL_STYLE_ACTIONS } from '@/store/Actions';

import type { ToolStyleActionTypes, ToolStyleState } from './types';

export function InitToolStyleConfig(): ToolStyleActionTypes {
  return {
    type: TOOL_STYLE_ACTIONS.INIT_TOOL_STYLE_CONFIG,
    payload: undefined,
  };
}

export function updateCollapseStatus(isCollapse: boolean) {
  return {
    type: TOOL_STYLE_ACTIONS.UPDATE_COLLAPSE_STATUS,
    payload: { imgListCollapse: isCollapse },
  };
}

export function UpdateToolStyleConfig(toolStyle: Partial<ToolStyleState>): ToolStyleActionTypes {
  return {
    type: TOOL_STYLE_ACTIONS.UPDATE_TOOL_STYLE_CONFIG,
    payload: toolStyle,
  };
}

export default {
  InitToolStyleConfig,
  UpdateToolStyleConfig,
  updateCollapseStatus,
};
