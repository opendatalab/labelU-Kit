import type { BBox } from 'rbush';

import type { BasicImageAnnotation } from '../interface';

interface ITool {
  style: Record<string, any>;

  hoveredStyle: Record<string, any>;

  selectedStyle: Record<string, any>;

  getLabelByValue: (value: string) => { label: string; color: string } | undefined;
}

export interface IAnnotation<Data extends BasicImageAnnotation, Tool> {
  id: string;

  data: Data;

  tool: Tool;

  getBBox: () => BBox;

  render: (ctx: CanvasRenderingContext2D) => void;

  destroy: () => void;

  readonly isHovered: boolean;

  /** 对比标注顺序之后悬浮的标识 */
  hovered: boolean;

  /** 对比标注顺序之后选中的标识 */
  selected: boolean;
}

export class Annotation<Data extends BasicImageAnnotation, Tool extends ITool> implements IAnnotation<Data, Tool> {
  public id: string;

  public data: Data;

  public tool: Tool;

  public hovered: boolean = false;

  public selected: boolean = false;

  /**
   * 标签分类的颜色所影响的canvas样式属性
   *
   * @default ['stroke']
   */
  public effectedStyles: string[] = ['stroke'];

  public get isHovered() {
    return false;
  }

  constructor(id: string, data: Data, tool: Tool) {
    this.id = id;
    this.data = data;
    this.tool = tool;
  }

  public getBBox() {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    };
  }

  public getStyle() {
    const { data, tool, hovered, selected, effectedStyles } = this;
    const { style } = tool;

    if (!data.label) {
      return style;
    }

    const styleWithLabel = {
      ...style,
    };

    for (const prop of effectedStyles) {
      if (styleWithLabel[prop]) {
        styleWithLabel[prop] = tool.getLabelByValue(data.label)?.color || style[prop];
      }
    }

    if (hovered) {
      return {
        ...styleWithLabel,
        ...tool.hoveredStyle,
      };
    }

    if (selected) {
      return {
        ...styleWithLabel,
        ...tool.selectedStyle,
      };
    }

    return styleWithLabel;
  }

  public render(_ctx: CanvasRenderingContext2D) {
    console.warn('Implement me!');
  }

  public destroy() {
    this.data = null as any;
    this.tool = null as any;
  }
}
