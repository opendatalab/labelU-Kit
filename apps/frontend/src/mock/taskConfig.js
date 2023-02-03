import { cTool } from '@label-u/lb-annotation';
const { EVideoToolName, EToolName } = cTool;

const rectToolConfig = {
  showConfirm: false, // 无效配置
  skipWhileNoDependencies: false, // 无效配置
  drawOutsideTarget: false, //框是否可以画至图片以外
  copyBackwardResult: false, // 无效配置
  minWidth: 1, // 拉框最小宽度
  minHeight: 1, // 拉框最小高度
  filterData: ['valid', 'invalid'],
  attributeConfigurable: true, //是否显示拉框标签配置选项
  attributeList: [
    { key: '玩偶1', value: 'doll' },
    { key: '喷壶', value: 'wateringCan' },
    { key: '脸盆', value: 'washbasin' },
    { key: '保温杯', value: 'vacuumCup' },
    { key: '纸巾', value: 'tissue' },
    { key: '水壶', value: 'kettle' },
  ], //拉框标签配置选项
  textConfigurable: false, //拉框标签是否可配置
  textCheckType: 4, //拉框标签检查输入类型配置 1 为数字 2 为英文 3为数字 4 为任意字符
  customFormat: '', // 无效配置
};

const tagToolConfig = {
  inputList: [
    {
      key: '类别1',
      value: 'class1',
      isMulti: false,
      subSelected: [
        { key: '选项1', value: 'option1', isDefault: true },
        { key: '选项2', value: 'option1-2', isDefault: false },
      ],
    },
    {
      key: '类别2',
      value: 'class-AH',
      isMulti: true,
      subSelected: [
        { key: '选项2-1', value: 'option2-1', isDefault: true },
        { key: '选项2-2', value: 'option2-2', isDefault: true },
        { key: '选项2-3', value: 'option2-3', isDefault: false },
      ],
    },
    {
      key: '类别3',
      value: 'class-0P',
      isMulti: false,
      subSelected: [
        { key: '选项3-1', value: 'option3-1', isDefault: false },
        { key: '选项3-2', value: 'option3-2', isDefault: false },
        { key: '选项3-3', value: 'option3-3', isDefault: false },
      ],
    },
    {
      key: '类别4',
      value: 'class-4',
      isMulti: true,
      subSelected: [
        { key: '选项2-1', value: 'option2-1', isDefault: false },
        { key: '选项2-2', value: 'option2-2', isDefault: false },
        { key: '选项2-3', value: 'option2-3', isDefault: false },
      ],
    },
  ], // 标签配置
};

const lineToolConfig = {
  lineType: 0, // 配置拉线类型 0 为普通拉线，2为贝塞尔曲线
  lineColor: 1, // 配置拉线颜色，0为单一色，1 为多色（暂未生效）
  edgeAdsorption: false, //多线条情况下是否支持 点吸附
  outOfTarget: true,
  copyBackwardResult: false, //无效配置
  attributeConfigurable: true, //是否显示划线标签配置选项
  attributeList: [
    { key: '类别1', value: '类别1' },
    { key: '类别ao', value: 'class-ao' },
    { key: '类别M1', value: 'class-M1' },
    { key: '类别Cm', value: 'class-Cm' },
    { key: '类别c3', value: 'class-c3' },
    { key: '类别a0', value: 'class-a0' },
    { key: '类别u7', value: 'class-u7' },
    { key: '类别Zb', value: 'class-Zb' },
    { key: '类别zi', value: 'class-zi' },
  ], //划线标签配置选项
  textConfigurable: false, //划线标签是否可配置
  textCheckType: 4, //划线标签检查输入类型配置 1 为数字 2 为英文 3为数字 4 为任意字符(配合customFormat 使用)
  customFormat: '^[\\s\\S]{1,3}$', //划线标签检查输入格式正则
  showConfirm: true, //无效配置
  lowerLimitPointNum: 2, // 最少定点数
  upperLimitPointNum: '', // 最多顶点数
  preReferenceStep: 0, // 无效配置
  skipWhileNoDependencies: false, // 无效配置
  filterData: ['valid', 'invalid'], // 无效配置
};

const textToolConfig = {
  showConfirm: true,
  skipWhileNoDependencies: false,
  enableTextRecognition: true,
  recognitionMode: 'general',
  configList: [
    { label: '文本1', key: 'text1', required: false, default: 'default1', maxLength: 1000 },
    { label: '文本2', key: 'text2', required: true, default: 'default2', maxLength: 1000 },
    { label: '文本3', key: 'text3', required: true, default: 'default3', maxLength: 1000 },
  ],
  filterData: ['valid', 'invalid'],
};

const polygonConfig = {
  lineType: 0, // 配置拉线类型 0 为普通拉线，2为贝塞尔曲线
  lineColor: 0, // 配置拉线颜色，0为单一色，1 为多色（暂未生效）
  edgeAdsorption: false, //多线条情况下是否支持 点吸附
  drawOutsideTarget: false, // 无效配置
  copyBackwardResult: false, //无效配置
  attributeConfigurable: true, //是否显示分割标签配置选项
  attributeList: [
    { key: '玩偶', value: 'doll' },
    { key: '喷壶', value: 'wateringCan' },
    { key: '脸盆', value: 'washbasin' },
    { key: '保温杯', value: 'vacuumCup' },
    { key: '纸巾', value: 'tissue' },
    { key: '水壶', value: 'kettle' },
  ], //分割标签配置选项
  textConfigurable: false, //分割标签是否可配置
  textCheckType: 0, //分割标签检查输入类型配置 1 为数字 2 为英文 3为数字 4 为任意字符(配合customFormat 使用)
  customFormat: '', ///分割标签检查输入格式正则
};

export const getConfig = (tool) => {
  if (tool === EToolName.Line) {
    return lineToolConfig;
  }

  if (tool === EToolName.Rect) {
    return rectToolConfig;
  }

  if (tool === EToolName.Tag) {
    return tagToolConfig;
  }

  if (tool === EToolName.Text) {
    return textToolConfig;
  }

  if (tool === EToolName.Polygon) {
    return polygonConfig;
  }

  if (tool === EVideoToolName.VideoTagTool) {
    return tagToolConfig;
  }

  return rectToolConfig;
};

export const getStepList = (tool, sourceStep, step) => {
  return [getStepConfig(tool)];
};

const getStepConfig = (tool, step, sourceStep) => {
  return {
    step: step ?? 1,
    dataSourceStep: sourceStep || 0,
    tool: tool ?? EToolName.Rect,
    config: JSON.stringify(getConfig(tool)),
  };
};

export const getDependStepList = (toolsArray) => toolsArray.map((tool, index) => getStepConfig(tool, index + 1, index));
