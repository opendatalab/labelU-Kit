import { type Attribute, type ILabel } from '@labelu/interface';

import { EInternalEvent } from '../enums';
import type { Annotation } from '../annotation/Annotation';
import type { ToolName, BasicImageAnnotation } from '../interface';
import type { Shape } from '../shapes';
import { eventEmitter } from '../singletons';

export function MouseDecorator<T extends { new (...args: any[]): any }>(constructor: T) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);

      eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
      eventEmitter.on(EInternalEvent.AnnotationMove, this._handleMouseMove);
      eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleMouseUp);
    }
    public _handleMouseDown = (e: MouseEvent) => {
      if (typeof this.onMouseDown === 'function') {
        this.onMouseDown(e);
      }
    };

    public _handleMouseMove = (e: MouseEvent) => {
      if (typeof this.onMouseMove === 'function') {
        this.onMouseMove(e);
      }
    };

    public _handleMouseUp = (e: MouseEvent) => {
      if (typeof this.onMouseUp === 'function') {
        this.onMouseUp(e);
      }
    };

    public destroy() {
      super.destroy();
      eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleMouseDown);
      eventEmitter.off(EInternalEvent.AnnotationMove, this._handleMouseMove);
      eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleMouseUp);
    }
  };
}

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

  /**
   * 是否显示标注顺序
   *
   * @default false
   */
  showOrder: boolean;
}

type IAnnotation<Data extends BasicImageAnnotation, Style> = Annotation<Data, Shape<Style>, Style>;

type ConfigOmit<T> = Omit<T, 'data' | 'style' | 'hoveredStyle' | 'name'>;

interface ExtraParams {
  name: ToolName;
}

/**
 * 工具基类
 */
export class Tool<Data extends BasicImageAnnotation, Style, Config extends BasicToolParams<Data, Style>> {
  public name: ToolName;
  public defaultColor = '#000';

  public labelMapping: Map<string, ILabel> = new Map();

  public style = {} as Required<Style>;

  public hoveredStyle = {} as Style;

  public selectedStyle = {} as Style;
  public data: Data[];
  public config;

  public activeLabel: string | undefined = undefined;

  public drawing: Map<string, IAnnotation<Data, Style>> | null = new Map();

  /**
   * 选中的标注切换成草稿
   *
   * @description 绘制过程中的标注不一定在这个字段下，可能视情况而定
   */
  public draft: IAnnotation<Data, Style> | null = null;

  public showOrder: boolean;

  constructor({
    name,
    data,
    style,
    hoveredStyle,
    selectedStyle,
    showOrder,
    ...config
  }: Required<Config> & ExtraParams) {
    // 创建标签映射
    this._createLabelMapping(config.labels);

    this.name = name;
    this.showOrder = Boolean(showOrder);

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

  public activate(label?: string) {
    const { activeLabel } = this;

    if (!label) {
      // 没有传入label且当前没有使用过label，则使用第一个label
      if (!activeLabel) {
        this.activeLabel = this.labelMapping.keys().next().value;
      }

      return;
    }

    this.activeLabel = label;
  }

  public deactivate() {
    this.activeLabel = undefined;
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
      throw Error('value is not a string', value);
    }

    return this.labelMapping.get(value);
  }

  public getLabelText(value: string | undefined) {
    if (typeof value !== 'string') {
      throw Error('value is not a string', value);
    }

    return this.getLabelByValue(value)?.key ?? '无标签';
  }

  public getLabelColor(value: string | undefined) {
    if (!value) {
      return this.defaultColor;
    }

    return this.getLabelByValue(value)?.color ?? this.defaultColor;
  }

  public removeFromDrawing(id: string) {
    this.drawing?.get(id)?.destroy();
    this.drawing?.delete(id);
  }

  public clearDrawing() {
    this.drawing?.forEach((annotation) => {
      annotation.destroy();
    });
    this.drawing?.clear();
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
