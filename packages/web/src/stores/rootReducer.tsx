import { combineReducers } from '@reduxjs/toolkit';
import userReducer from './user.store';
import toolsConfigSliceReducer from './toolConfig.store';

const rootReducer = combineReducers({
  user: userReducer,
  toolsConfig: toolsConfigSliceReducer
});

export default rootReducer;
