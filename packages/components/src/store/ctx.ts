import React from 'react';
import { createDispatchHook, createSelectorHook } from 'react-redux';
import { AnyAction, Dispatch } from 'redux';

export const LabelUContext = React.createContext(undefined) as any;
export const useDispatch = createDispatchHook(LabelUContext) as () => Dispatch<AnyAction | any>; // TODO, Any need to be updated.
export const useSelector = createSelectorHook(LabelUContext);
