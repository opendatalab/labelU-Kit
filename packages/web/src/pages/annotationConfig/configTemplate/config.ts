import { Item } from './tmplateBox';
// import RectImg from '../../../img/annotationCommon/configNotMatch.png';
interface configItem {
  label: string;
  img: any;
  tmplateName: any;
}

export const imgLebalConfig: Item[] = [
  {
    label: '目标检测（矩形框）',
    img: 'rectImg',
    tmplateName: 'rect.json'
  },
  {
    label: '语义分割(多边形)',
    img: 'polygonImg',
    tmplateName: 'polygon.json'
  },
  {
    label: '线标注',
    img: 'lineImg',
    tmplateName: 'line.json'
  },
  {
    label: '点标注',
    img: 'pointImg',
    tmplateName: 'point.json'
  },
  {
    label: '目标分类(标签分类)',
    img: 'tagImg',
    tmplateName: 'tag.json'
  },
  {
    label: '文本描述',
    img: 'textImg',
    tmplateName: 'text.json'
  }
];

export const getLabelConfig: (imgLebalConfig: Item[]) => Promise<configItem[]> = async (imgLebalConfig: Item[]) => {
  return new Promise(async (resolve, reject) => {
    const reuslt: configItem[] = [];
    if (imgLebalConfig.length > 0) {
      for (let item of imgLebalConfig) {
        let { default: imgSrc } = await import(`../avatorImg/${item.img}.png`);
        let { default: tmpl } = await import(`../configs/${item.tmplateName}`);
        reuslt.push({
          label: item.label,
          img: imgSrc,
          tmplateName: tmpl
        });
      }
    }
    resolve(reuslt);
  });
};
