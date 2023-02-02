import { combineReducers } from '@reduxjs/toolkit';
import userReducer from './user.store';
import toolsConfigSliceReducer from './toolConfig.store';
import createTask from './createTask.store';
import existTask from './task.store';
import samples from './sample.store';
import annotation from './annotation.store';

const rootReducer = combineReducers({
  user: userReducer,
  toolsConfig: toolsConfigSliceReducer,
  createTask,
  existTask,
  samples,
  annotation,
});

export default rootReducer;
