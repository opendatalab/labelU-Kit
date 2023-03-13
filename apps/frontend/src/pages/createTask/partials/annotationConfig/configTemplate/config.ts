import type { ToolsConfigState } from '@/types/toolConfig';

import type { Item } from './templateBox';
import { rectTool, pointTool, polygonTool, lineTool, textTool, tagTool } from '../configs';

interface ConfigItem {
  label: string;
  img: any;
  templateName: any;
}

const templateMapping: Record<string, unknown> = {
  rectTool,
  pointTool,
  polygonTool,
  lineTool,
  textTool,
  tagTool,
};

const imgLabelConfig: Item[] = [
  {
    label: '目标检测（矩形框）',
    img: 'rectImg',
    templateName: 'rectTool',
  },
  {
    label: '语义分割(多边形)',
    img: 'polygonImg',
    templateName: 'polygonTool',
  },
  {
    label: '线标注',
    img: 'lineImg',
    templateName: 'lineTool',
  },
  {
    label: '点标注',
    img: 'pointImg',
    templateName: 'pointTool',
  },
  {
    label: '目标分类(标签分类)',
    img: 'tagImg',
    templateName: 'tagTool',
  },
  {
    label: '文本描述',
    img: 'textImg',
    templateName: 'textTool',
  },
];

export const getLabelConfig: () => Promise<ConfigItem[]> = async () => {
  return new Promise(async (resolve) => {
    const result: ConfigItem[] = [];
    if (imgLabelConfig.length > 0) {
      for (const item of imgLabelConfig) {
        const { default: imgSrc } = await import(`../frontCoverImg/${item.img}.png`);
        result.push({
          label: item.label,
          img: imgSrc,
          templateName: templateMapping[item.templateName],
        });
      }
    }
    resolve(result);
  });
};

// 加载初始化配置
export const LoadInitConfig: (toolName: string) => Promise<ToolsConfigState> = async (toolName: string) => {
  return new Promise(async (resolve, reject) => {
    const result = templateMapping[toolName];
    if (result) {
      //@ts-ignore
      resolve(result);
    } else {
      reject('err');
    }
  });
};

// 加载图片
export const loadImg: (path: string) => Promise<any> = async (path: string) => {
  return new Promise(async (resolve, reject) => {
    const basePath = '../../../img/';
    const { default: imgSrc } = await import(/* @vite-ignore */ basePath + path);
    if (imgSrc) {
      resolve(imgSrc);
    } else {
      reject('err');
    }
  });
};
