import { FileInfo } from '@label-u/components';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Attribute, OneTag, BasicConfig, ToolsConfigState, TextConfig } from 'interface/toolConfig';

const initialState: ToolsConfigState = {
  tools: [],
  tagList: [],
  attribute: [],
  textConfig: [],
  fileInfo: {} as FileInfo
};

const toolsConfigSlice = createSlice({
  name: 'stepConfig',
  initialState: initialState,
  reducers: {
    // 清空工具配置
    removeToolsConfig(state) {
      state.tools = [];
    },
    // 更新工具配置
    updateToolsConfig(state, action: PayloadAction<BasicConfig[]>) {
      state.tools = action.payload;
    },
    // 清空统一的attribute
    removeTagConfigList(state) {
      state.attribute = [];
    },
    // 更新
    updateTagConfigList(state, action: PayloadAction<OneTag[]>) {
      state.tagList = action.payload;
    },
    // 清空统一的tag
    removeAllTagConfigList(state) {
      state.tagList = [];
    },
    // 更新
    updateAllAttributeConfigList(state, action: PayloadAction<Attribute[]>) {
      state.attribute = action.payload;
    },
    // 更新文件信息
    updateFileInfo(state, action: PayloadAction<FileInfo>) {
      state.fileInfo = action.payload;
    },

    // 配置文本组建
    updateTextConfig(state, action: PayloadAction<TextConfig>) {
      state.textConfig = action.payload;
    },
    // 清空所有配置
    clearConfig(state) {
      state.tagList = [];
      state.tools = [];
      state.attribute = [];
      state.textConfig = [];
      state.fileInfo = {} as FileInfo;
    },
    // 更新全部配置
    updateAllConfig(state, action: PayloadAction<ToolsConfigState>) {
      state.attribute = action.payload.attribute;

      state.tools = action.payload.tools;

      state.tagList = action.payload.tagList;

      state.textConfig = action.payload.textConfig;
      state.fileInfo = action.payload.fileInfo;
    }
  }
});

export const {
  updateFileInfo,
  removeToolsConfig,
  updateToolsConfig,
  removeTagConfigList,
  updateTagConfigList,
  removeAllTagConfigList,
  updateAllAttributeConfigList,
  updateTextConfig,
  clearConfig,
  updateAllConfig
} = toolsConfigSlice.actions;

export default toolsConfigSlice.reducer;
