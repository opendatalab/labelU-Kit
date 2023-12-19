import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import { EInternalEvent } from '../enums';
import type { AxisPoint, PointStyle } from '../shapes/Point.shape';
import { Point } from '../shapes/Point.shape';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { PointData } from '../annotation/Point.annotation';
import { AnnotationPoint } from '../annotation/Point.annotation';
// import { PointPen } from '../pen';
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
   * 画布外标注
   * @default true;
   */
  outOfCanvas?: boolean;
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
      outOfCanvas: true,
      data: [],
      // ----------------
      ...params,
      style: {
        ...Point.DEFAULT_STYLE,
        ...params.style,
      },
    });

    this._createDrawingFromData();

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleMouseUp);
  }

  private _createDrawingFromData(data: PointData[] = this.data) {
    for (const item of data) {
      this._addAnnotation(item);
    }
  }

  private _createDraft(data: PointData) {
    const { style, selectedStyle } = this;

    this.draft = new AnnotationPoint({
      id: data.id || uuid(),
      data,
      style: { ...style, ...selectedStyle },
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
        style: { ...style, fill: this.getLabelColor(data.label) },
        hoveredStyle,
        onSelect: this.onSelect,
      }),
    );
  }

  protected onSelect = (_e: MouseEvent, annotation: AnnotationPoint) => {
    this.activate(annotation.data.label);
    eventEmitter.emit(EInternalEvent.ToolChange, this.name, annotation.data.label);
    this._archive();
    this._createDraft(annotation.data);
    this.removeFromDrawing(annotation.id);
    // 重新渲染
    axis!.rerender();
  };

  protected onUnSelect = (_e: MouseEvent) => {
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

    // 没有激活工具则不进行绘制
    if (!activeLabel) {
      return;
    }

    this._archive();

    // 创建草稿
    this._createDraft({
      order: monitor!.getNextOrder(),
      id: uuid(),
      label: activeLabel,
      // 超出安全区域的点直接落在安全区域边缘
      x: axis!.getOriginalX(config.outOfCanvas ? e.offsetX : axis!.getSafeX(e.offsetX)),
      y: axis!.getOriginalY(config.outOfCanvas ? e.offsetY : axis!.getSafeY(e.offsetY)),
    });

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
    if (!config.outOfCanvas) {
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

  public deactivate(): void {
    super.deactivate();
    this._archive();
    axis!.rerender();
  }

  public destroy(): void {
    super.destroy();

    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleMouseUp);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);
  }
}
