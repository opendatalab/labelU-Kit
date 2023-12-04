import { v4 as uuid } from 'uuid';

import { EInternalEvent } from '../enums';
import type { PointStyle } from '../shape/Point.shape';
import { Point } from '../shape/Point.shape';
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

  /**
   * 边缘吸附
   * @default true;
   */
  edgeAdsorptive?: boolean;
}

export class PointTool extends Tool<PointData, PointStyle, PointToolOptions> {
  constructor(params: PointToolOptions) {
    super({
      name: 'point',
      labels: [],
      hoveredStyle: {},
      selectedStyle: {},
      maxPointAmount: Infinity,
      minPointAmount: 0,
      outOfCanvas: true,
      edgeAdsorptive: true,
      data: [],
      // ----------------
      ...params,
      style: {
        ...Point.DEFAULT_STYLE,
        ...params.style,
      },
    });

    this._createDrawingFromData();

    eventEmitter.on(EInternalEvent.LeftMouseDownWithoutTarget, this._handleMouseDown);
  }

  private _createDrawingFromData(data: PointData[] = this.data) {
    for (const item of data) {
      this.addAnnotation(item);
    }
  }

  private _createDraft(data: PointData) {
    const { style, selectedStyle } = this;

    this.draft = new AnnotationPoint({
      id: data.id || uuid(),
      data,
      style: { ...style, ...selectedStyle },
      onPick: this.onPick,
      onUnSelect: this.onUnSelect,
      onMove: this.onMove,
      onMoveEnd: this.onMoveEnd,
    });
    monitor!.setSelectedAnnotationId(this.draft.id);
  }

  public addAnnotation(data: PointData) {
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
    this.previousCoordinates = this.getCoordinates();
    // 重新渲染
    axis!.rerender();
  };

  public onPick = (_e: MouseEvent) => {
    this.previousCoordinates = this.getCoordinates();
    // 重新渲染
    axis!.rerender();
  };

  protected onUnSelect = (_e: MouseEvent) => {
    this._archive();
    // 重新渲染
    axis!.rerender();
  };

  /**
   * 移动选中的点
   */
  protected onMove = (_e: MouseEvent) => {
    const { draft, previousCoordinates } = this;

    if (!draft) {
      return;
    }

    draft.group.each((shape, index) => {
      shape.dynamicCoordinate[0].x = previousCoordinates[index][0].x + axis!.distance.x;
      shape.dynamicCoordinate[0].y = previousCoordinates[index][0].y + axis!.distance.y;
    });

    draft.syncCoordToData();
  };

  protected onMoveEnd = () => {
    this.previousCoordinates = this.getCoordinates();
  };

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);
  }

  private _archive() {
    const { draft } = this;

    if (draft) {
      this.addAnnotation(draft.data);
      draft.destroy();
      this.draft = null;
    }
  }

  private _handleMouseDown = (e: MouseEvent) => {
    const { activeLabel } = this;

    // 没有激活工具则不进行绘制
    if (!activeLabel) {
      return;
    }

    this._archive();

    // 创建草稿
    this._createDraft({
      order: monitor!.getMaxOrder() + 1,
      id: uuid(),
      label: activeLabel,
      x: axis!.getOriginalX(e.offsetX - axis!.distance.x),
      y: axis!.getOriginalY(e.offsetY - axis!.distance.y),
    });

    axis?.rerender();
  };
}
