import type { Attribute, ILabel } from '@labelu/interface';
import cloneDeep from 'lodash.clonedeep';

import type { Annotation } from '../annotation/Annotation';
import type { BasicImageAnnotation } from '../interface';
import type { AxisPoint, Shape } from '../shape';

export const TOOL_HOVER = 'tool:hover';

export interface BasicToolParams<Data, Style> {
  /** 标签配置 */
  labels?: Attribute[];
  data?: Data[];

  /** 标注静止的样式 */
  style?: Style;

  /** 标注悬浮的样式 */
  hoveredStyle?: Style;

  /** 标注选中的样式 */
  selectedStyle?: Style;
}

type IAnnotation<Style> = Annotation<BasicImageAnnotation, Shape<Style>, Style>;

type ConfigOmit<T> = Omit<T, 'data' | 'style' | 'hoveredStyle'>;

/**
 * 工具基类
 */
export class Tool<Data extends BasicImageAnnotation, Style, Config extends BasicToolParams<Data, Style>> {
  public defaultColor = '#000';

  public labelMapping = new Map();

  public style = {} as Required<Style>;

  public hoveredStyle = {} as Style;

  public selectedStyle = {} as Style;
  public data: Data[];
  public config;

  public activeLabel: string | null = null;

  public drawing: Map<string, IAnnotation<Style>> | null = new Map();

  /**
   * 绘制过程中的临时数据，并未真正添加到数据中
   * Group<Line, LineStyle>
   */
  public draft: IAnnotation<Style> | null = null;

  protected previousCoordinates: AxisPoint[][] = [];

  constructor({ data, style, hoveredStyle, selectedStyle, ...config }: Required<Config>) {
    // 创建标签映射
    this._createLabelMapping(config.labels);

    if (style) {
      this.style = {
        ...this.style,
        ...style,
      };
    }

    if (hoveredStyle) {
      this.hoveredStyle = hoveredStyle;
    }

    if (selectedStyle) {
      this.selectedStyle = selectedStyle;
    }
    this.config = config as ConfigOmit<Config>;
    this.data = data || [];
  }

  public addAnnotation(_data: Data) {
    console.error('Implement me!');
  }

  public render(ctx: CanvasRenderingContext2D) {
    const { drawing, draft } = this;

    if (drawing) {
      drawing.forEach((annotation) => {
        annotation.render(ctx);
      });
    }

    if (draft) {
      draft.render(ctx);
    }
  }

  public updateStyle(style: Style) {
    this.style = { ...this.style, ...style };
  }

  public activate(label: string) {
    if (typeof this.getLabelByValue(label) === 'undefined') {
      console.warn('label is not defined', label);

      return;
    }

    this.activeLabel = label;
  }

  public deactivate() {
    this.activeLabel = null;
    this.previousCoordinates = [];
  }

  public getCoordinates() {
    const { draft } = this;

    if (!draft) {
      return [];
    }

    return draft.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  _createLabelMapping(labels: ILabel[] | undefined) {
    if (!labels) {
      return;
    }

    for (const label of labels) {
      this.labelMapping.set(label.value, label);
    }
  }

  public getLabelByValue(value: string | undefined) {
    if (typeof value !== 'string') {
      console.warn('value is not a string', value);
      return undefined;
    }

    return this.labelMapping.get(value);
  }

  public getLabelColor(label: string | undefined) {
    if (!label) {
      return this.defaultColor;
    }

    return this.getLabelByValue(label)?.color ?? this.defaultColor;
  }

  public removeFromDrawing(id: string) {
    this.drawing?.get(id)?.destroy();
    this.drawing?.delete(id);
  }

  public destroy(): void;
  public destroy(): void {
    this.drawing?.forEach((annotation) => {
      annotation.destroy();
    });
    this.drawing = null;
    this.draft?.destroy();
    this.draft = null;

    this.data = [];
  }
}
