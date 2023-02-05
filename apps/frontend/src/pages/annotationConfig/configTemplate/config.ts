import type { ToolsConfigState } from '@/interface/toolConfig';

import type { Item } from './tmplateBox';
// import RectImg from '../../../img/annotationCommon/configNotMatch.png';
interface ConfigItem {
  label: string;
  img: any;
  tmplateName: any;
}

const imgLebalConfig: Item[] = [
  {
    label: '目标检测（矩形框）',
    img: 'rectImg',
    tmplateName: 'rectTool.json',
  },
  {
    label: '语义分割(多边形)',
    img: 'polygonImg',
    tmplateName: 'polygonTool.json',
  },
  {
    label: '线标注',
    img: 'lineImg',
    tmplateName: 'lineTool.json',
  },
  {
    label: '点标注',
    img: 'pointImg',
    tmplateName: 'pointTool.json',
  },
  {
    label: '目标分类(标签分类)',
    img: 'tagImg',
    tmplateName: 'tagTool.json',
  },
  {
    label: '文本描述',
    img: 'textImg',
    tmplateName: 'textTool.json',
  },
];

export const getLabelConfig: () => Promise<ConfigItem[]> = async () => {
  return new Promise(async (resolve) => {
    const reuslt: ConfigItem[] = [];
    if (imgLebalConfig.length > 0) {
      for (const item of imgLebalConfig) {
        const { default: imgSrc } = await import(`../frontCoverImg/${item.img}.png`);
        const { default: tmpl } = await import(`../configs/${item.tmplateName}`);
        reuslt.push({
          label: item.label,
          img: imgSrc,
          tmplateName: tmpl,
        });
      }
    }
    resolve(reuslt);
  });
};

// 加载初始化配置
export const LoadInitConfig: (toolName: string) => Promise<ToolsConfigState> = async (toolName: string) => {
  return new Promise(async (resolve, reject) => {
    const { default: tmpl } = await import(`../configs/${toolName}.json`);
    if (tmpl) {
      //@ts-ignore
      resolve(tmpl);
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
