import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import { EInternalEvent } from '../enums';
import type { AxisPoint, PointStyle } from '../shapes/Point.shape';
import { Point } from '../shapes/Point.shape';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { PointData } from '../annotations/Point.annotation';
import { AnnotationPoint } from '../annotations/Point.annotation';
import { axis, eventEmitter, monitor } from '../singletons';
import { DraftPoint } from '../drafts';

/**
 * 点标注工具配置
 */
export interface PointToolOptions extends BasicToolParams<PointData, PointStyle> {
  /**
   * 上限点数
   *
   * @default undefined 默认无限制
   */
  maxPointAmount?: number;

  /**
   * 下限点数
   *
   * @default 0
   */
  minPointAmount?: number;

  /**
   * 图片外标注
   * @default true;
   */
  outOfImage?: boolean;
}

export class PointTool extends Tool<PointData, PointStyle, PointToolOptions> {
  static convertToCanvasCoordinates(data: PointData[]) {
    return data.map((item) => ({
      ...item,
      ...axis!.convertSourceCoordinate(item),
    }));
  }

  private _pickedCoordinate: AxisPoint | null = null;

  public draft: DraftPoint | null = null;

  constructor(params: PointToolOptions) {
    super({
      name: 'point',
      labels: [],
      maxPointAmount: Infinity,
      minPointAmount: 0,
      outOfImage: true,
      data: [],
      // ----------------
      ...params,
      style: {
        ...Point.DEFAULT_STYLE,
        ...params.style,
      },
    });

    AnnotationPoint.buildLabelMapping(params.labels ?? []);

    this._setupShapes();

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.Delete, this._handleDelete);
    eventEmitter.on(EInternalEvent.BackSpace, this._handleDelete);
  }

  private _setupShapes(data: PointData[] = this._data) {
    for (const item of data) {
      this._addAnnotation(item);
    }
  }

  private _validate() {
    const { config, data } = this;

    if (data.length >= config.maxPointAmount!) {
      Tool.error({
        type: 'maxPointAmount',
        message: `Maximum number of points reached!`,
      });

      return false;
    }

    return true;
  }

  private _createDraft(data: PointData) {
    const { style, config } = this;

    this.draft = new DraftPoint(config, {
      id: data.id || uuid(),
      data,
      showOrder: this.showOrder,
      style,
      onUnSelect: this.onUnSelect,
    });
    monitor!.setSelectedAnnotationId(this.draft.id);
  }

  private _addAnnotation(data: PointData) {
    const { style, hoveredStyle } = this;

    this.drawing!.set(
      data.id,
      new AnnotationPoint({
        id: data.id,
        data,
        showOrder: this.showOrder,
        style,
        hoveredStyle,
        onSelect: this.onSelect,
      }),
    );
  }

  private _handleDelete = () => {
    const { draft } = this;

    // 如果正在创建，则取消创建
    if (draft) {
      // 如果选中了草稿，则删除草稿
      const data = cloneDeep(draft.data);
      this.deleteDraft();
      axis?.rerender();
      Tool.onDelete({ ...data, ...axis!.convertCanvasCoordinate(data) });
    }
  };

  protected onSelect = (_e: MouseEvent, annotation: AnnotationPoint) => {
    Tool.emitSelect({
      ...annotation.data,
      ...axis!.convertCanvasCoordinate(annotation.data),
    });

    this.activate(annotation.data.label);
    eventEmitter.emit(EInternalEvent.ToolChange, this.name, annotation.data.label);
    this._archive();
    this._createDraft(annotation.data);
    this.removeFromDrawing(annotation.id);
    // 重新渲染
    axis!.rerender();
  };

  protected onUnSelect = (_e: MouseEvent) => {
    if (this.draft) {
      Tool.emitUnSelect({
        ...this.draft.data,
        ...axis!.convertCanvasCoordinate(this.draft.data),
      });
    }

    this._archive();
    // 重新渲染
    axis!.rerender();
  };

  private _archive() {
    const { draft } = this;

    if (draft) {
      this._addAnnotation(draft.data);
      draft.destroy();
      this.draft = null;
    }
  }

  private _handleMouseDown = (e: MouseEvent) => {
    // ====================== 绘制 ======================

    const { activeLabel, config, draft } = this;

    const isUnderDraft = draft && draft.isUnderCursor({ x: e.offsetX, y: e.offsetY });

    // 1. 没有激活工具则不进行绘制
    // 2. 按下空格键时不进行绘制
    if (!activeLabel || isUnderDraft || monitor?.keyboard.Space) {
      return;
    }

    this._archive();

    if (!this._validate()) {
      return;
    }

    const data = {
      order: monitor!.getNextOrder(),
      id: uuid(),
      label: activeLabel,
      // 超出安全区域的点直接落在安全区域边缘
      x: axis!.getOriginalX(config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX)),
      y: axis!.getOriginalY(config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY)),
    };

    Tool.onAdd({ ...data, ...axis!.convertCanvasCoordinate(data) }, e);

    // 创建草稿
    this._createDraft(data);

    axis?.rerender();
  };

  private _rebuildDraft(data?: PointData) {
    if (!this.draft) {
      return;
    }

    const dataClone = cloneDeep(data ?? this.draft.data);

    this.draft.destroy();
    this.draft = null;
    this._createDraft(dataClone);
  }

  public deactivate(): void {
    super.deactivate();
    this._archive();
    axis!.rerender();
  }

  public setLabel(value: string): void {
    const { draft, activeLabel } = this;

    if (!draft || !activeLabel || activeLabel === value) {
      return;
    }

    this.activate(value);

    const data = cloneDeep(draft.data);

    this._rebuildDraft({
      ...data,
      label: value,
    });
  }

  public toggleOrderVisible(visible: boolean): void {
    this.showOrder = visible;

    this.clearDrawing();
    this._setupShapes();
    this._rebuildDraft();
  }

  public get data() {
    const result = super.data;

    return result.map((item) => {
      return {
        ...item,
        ...axis!.convertCanvasCoordinate(item),
      };
    });
  }

  public destroy(): void {
    super.destroy();

    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.off(EInternalEvent.Delete, this._handleDelete);
    eventEmitter.off(EInternalEvent.BackSpace, this._handleDelete);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);
  }
}
