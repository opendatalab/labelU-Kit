import { type Attribute, type ILabel } from '@labelu/interface';
import cloneDeep from 'lodash.clonedeep';

import type { Annotation } from '../annotations/Annotation';
import type { ToolName, BasicImageAnnotation } from '../interface';
import type { Group, Shape } from '../shapes';
import { axis, eventEmitter, monitor } from '../singletons';
import type { Draft } from '../drafts/Draft';
import { EInternalEvent } from '../enums';

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
  showOrder?: boolean;
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

  public labelMapping: Map<string, ILabel> = new Map();

  public style = {} as Required<Style>;

  public hoveredStyle;

  public selectedStyle;

  public config;

  public activeLabel: string | undefined = undefined;

  public drawing: Map<string, IAnnotation<Data, Style>> | null = new Map();

  /**
   * 选中的标注切换成草稿
   *
   * @description 绘制过程中的标注不一定在这个字段下，可能视情况而定
   */
  public draft: Draft<Data, any, any> | null = null;

  /**
   * 绘制过程中的草稿
   */
  public sketch: Group<Shape<any>, any> | Shape<any> | null = null;

  public showOrder: boolean;

  protected _data: Data[];

  /**
   * 按下鼠标的调用，在各自的工具中实现
   */
  protected handleMouseDown = (_e: MouseEvent) => {
    // do nothing
    console.warn('handleMouseDown is not implemented!');
  };

  /**
   * 鼠标移动的调用，在各自的工具中实现
   */
  protected handleMouseMove = (_e: MouseEvent) => {
    // do nothing
  };

  /**
   * 按下esc键盘的调用，在各自的工具中实现
   */
  protected handleEscape = (_e: MouseEvent) => {
    // do nothing
  };

  /**
   * 按下Del键盘的调用，在各自的工具中实现
   */
  protected handleDelete = (_e: KeyboardEvent) => {
    // do nothing
  };

  protected convertAnnotationItem(_item: Data) {
    // do nothing
  }

  protected setupShapes() {
    // do nothing
    console.warn('setupShapes is not implemented!');
  }

  protected archiveDraft() {
    // do nothing
    console.warn('archiveDraft is not implemented!');
  }

  protected destroySketch() {
    const { sketch } = this;

    if (sketch) {
      sketch.destroy();
      this.sketch = null;
    }
  }

  protected rebuildDraft(_data: Data) {
    // do nothing
    console.warn('rebuildDraft is not implemented!');
  }

  public deleteAnnotation(_id: string): void {
    console.warn('deleteAnnotation is not implemented!');
  }

  public toggleOrderVisible(_visible: boolean): void {
    console.warn('toggleOrderVisible is not implemented!');
  }

  public setLabel(_label: string): void {
    console.warn('setLabel is not implemented!');
  }

  public setAttributes(_attributes: Record<string, string | string[]>) {
    console.warn('setAttributes is not implemented!');
  }

  public toggleAnnotationsVisibility(_ids: string[], _visible: boolean): void {
    console.warn('toggleAnnotationsVisibility is not implemented!');
  }

  public load(_data: Data[]) {
    // do nothing
    console.warn('load is not implemented!');
  }

  public refresh() {
    // do nothing
    console.warn('refresh is not implemented!');
  }

  public clear() {
    // do nothing
    console.warn('clear is not implemented!');
  }

  constructor({ name, data, style, hoveredStyle, selectedStyle, showOrder, ...config }: Config & ExtraParams) {
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
    this._data = data || [];
  }

  protected addToData(data: Data) {
    this._data.push(data);
  }

  protected removeFromDrawing(id: string) {
    const annotation = this.drawing?.get(id);
    annotation?.destroy();
    this.drawing?.delete(id);
    // 取消选中标注时，需要将数据加回来
    this._removeDataItem(id);
  }

  protected recoverData() {
    const { draft } = this;

    if (draft) {
      this._data.push(cloneDeep(draft.data));
    }
  }

  protected clearDrawing() {
    this.drawing?.forEach((annotation) => {
      annotation.destroy();
    });
    this.drawing?.clear();
  }

  protected deleteDraft() {
    const { draft } = this;

    if (draft) {
      draft.destroy();
      this.draft = null;
    }
  }

  protected onAnnotationSelect(data: Data) {
    this.destroySketch();
    this.activate(data.label);
    this.removeFromDrawing(data.id);
    eventEmitter.emit(EInternalEvent.ToolChange, this.name, data.label);
    axis?.rerender();
  }

  private _createLabelMapping(labels: ILabel[] | undefined) {
    if (!labels) {
      return;
    }

    for (const label of labels) {
      this.labelMapping.set(label.value, label);
    }
  }

  private _removeDataItem(id: string) {
    const index = this._data.findIndex((item) => item.id === id);

    if (index > -1) {
      this._data.splice(index, 1);
    }
  }

  static error(message: { type: string; message: string; value?: any }) {
    eventEmitter.emit('error', message);
  }

  static onAdd<T>(datas: T[], e?: MouseEvent) {
    eventEmitter.emit('add', datas, e);
  }

  static emitSelect<T>(data: T, toolName: ToolName) {
    eventEmitter.emit('select', data, toolName);
  }

  static emitUnSelect<T>(data: T) {
    monitor!.selectedAnnotationId = null;
    eventEmitter.emit('unselect', data);
  }

  static onDelete<T>(data: T) {
    eventEmitter.emit('delete', data);
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

  public get data() {
    const { drawing, draft } = this;

    if (!drawing) {
      return [];
    }

    if (draft) {
      return [...Array.from(drawing.values()).map((annotation) => annotation.data), draft.data];
    }

    return Array.from(drawing.values()).map((annotation) => annotation.data);
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.sketch) {
      Promise.resolve().then(() => {
        this.sketch?.render(ctx);
      });
    }
  }

  public destroy(): void;
  public destroy(): void {
    this.drawing?.forEach((annotation) => {
      annotation.destroy();
    });
    this.drawing = null;
    this.draft?.destroy();
    this.draft = null;
    this.sketch?.destroy();
    this.sketch = null;

    this._data = [];
  }
}
