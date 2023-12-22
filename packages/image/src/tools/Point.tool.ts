import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';
import Color from 'color';

import { EInternalEvent } from '../enums';
import type { AxisPoint, PointStyle } from '../shapes/Point.shape';
import { Point } from '../shapes/Point.shape';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { PointData } from '../annotation/Point.annotation';
import { AnnotationPoint } from '../annotation/Point.annotation';
import { axis, eventEmitter, monitor } from '../singletons';

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
  constructor(params: PointToolOptions) {
    super({
      name: 'point',
      labels: [],
      hoveredStyle: {},
      selectedStyle: {},
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

    this._setupShapes();

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleMouseUp);
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
    this.draft = new AnnotationPoint({
      id: data.id || uuid(),
      data,
      showOrder: this.showOrder,
      label: this.getLabelText(data.label),
      style: this._makeSelectedStyle(data.label),
      onUnSelect: this.onUnSelect,
    });
    monitor!.setSelectedAnnotationId(this.draft.id);
  }

  private _addAnnotation(data: PointData) {
    this.drawing!.set(
      data.id,
      new AnnotationPoint({
        id: data.id,
        data,
        showOrder: this.showOrder,
        label: this.getLabelText(data.label),
        style: this._makeStaticStyle(data.label),
        hoveredStyle: this._makeHoveredStyle(data.label),
        onSelect: this.onSelect,
      }),
    );
  }

  private _makeStaticStyle(label?: string) {
    const { style } = this;

    if (typeof label !== 'string') {
      throw new Error('Invalid label! Must be string!');
    }

    return { ...style, fill: this.getLabelColor(label) };
  }

  private _makeHoveredStyle(label?: string) {
    const { style, hoveredStyle } = this;

    if (typeof label !== 'string') {
      throw new Error('Invalid label! Must be string!');
    }

    if (hoveredStyle && Object.keys(hoveredStyle).length > 0) {
      return hoveredStyle;
    }

    return {
      ...style,
      stroke: '#000',
      strokeWidth: 2,
      fill: Color('#fff').toString(),
    };
  }

  private _makeSelectedStyle(label?: string) {
    const { style, selectedStyle } = this;

    if (typeof label !== 'string') {
      throw new Error('Invalid label! Must be string!');
    }

    if (selectedStyle && Object.keys(selectedStyle).length > 0) {
      return selectedStyle;
    }

    const labelColor = this.getLabelColor(label);

    return {
      ...style,
      stroke: labelColor,
      strokeWidth: 4,
      fill: Color('#fff').toString(),
    };
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
    if (this.draft && this.draft.group.isShapesUnderCursor({ x: e.offsetX, y: e.offsetY })) {
      this._pickedCoordinate = cloneDeep(this.draft.group.shapes[0].dynamicCoordinate[0]);

      return;
    }

    // ====================== 绘制 ======================

    const { activeLabel, config } = this;

    // 1. 没有激活工具则不进行绘制
    // 2. 按下空格键时不进行绘制
    if (!activeLabel || monitor?.keyboard.Space) {
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

  private _handleMouseMove = () => {
    const { draft, _pickedCoordinate, config } = this;
    if (!draft || !_pickedCoordinate) {
      return;
    }

    let x = _pickedCoordinate.x + axis!.distance.x;
    let y = _pickedCoordinate.y + axis!.distance.y;

    // 安全区域内移动
    if (!config.outOfImage) {
      const safeZone = axis!.safeZone;

      if (x > safeZone.maxX) {
        x = safeZone.maxX;
      }

      if (x < safeZone.minX) {
        x = safeZone.minX;
      }

      if (y > safeZone.maxY) {
        y = safeZone.maxY;
      }

      if (y < safeZone.minY) {
        y = safeZone.minY;
      }
    }

    draft.group.each((shape) => {
      shape.coordinate = [
        axis!.getOriginalCoord({
          x,
          y,
        }),
      ];
    });
    draft.group.update();
    draft.syncCoordToData();
  };

  private _handleMouseUp = () => {
    this._pickedCoordinate = null;
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
    eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleMouseUp);
    eventEmitter.off(EInternalEvent.Delete, this._handleDelete);
    eventEmitter.off(EInternalEvent.BackSpace, this._handleDelete);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);
  }
}
