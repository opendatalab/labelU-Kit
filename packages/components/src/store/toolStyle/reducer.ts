import { TOOL_STYLE_ACTIONS } from '@/store/Actions';

import type { ToolStyleActionTypes, ToolStyleState } from './types';

const initialState: ToolStyleState = {
  color: 1,
  width: 2,
  borderOpacity: 9,
  fillOpacity: 9,
  imgListCollapse: true,
};

export function toolStyleReducer(state = { ...initialState }, action: ToolStyleActionTypes): ToolStyleState {
  switch (action.type) {
    case TOOL_STYLE_ACTIONS.INIT_TOOL_STYLE_CONFIG: {
      return {
        ...initialState,
      };
    }

    case TOOL_STYLE_ACTIONS.UPDATE_TOOL_STYLE_CONFIG: {
      const computeColor = {};

      return {
        ...state,
        ...action.payload,
        ...computeColor,
      };
    }

    case TOOL_STYLE_ACTIONS.UPDATE_COLLAPSE_STATUS: {
      return {
        ...state,
        ...action.payload,
      };
    }

    default:
      return state;
  }
}
