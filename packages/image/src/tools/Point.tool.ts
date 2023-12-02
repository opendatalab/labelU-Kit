import { ETool } from '../enums';
import type { PointStyle } from '../shape/Point.shape';
import { Point } from '../shape/Point.shape';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { PointData } from '../annotation/Point.annotation';
import { AnnotationPoint } from '../annotation/Point.annotation';
// import { PointPen } from '../pen';
import { axis } from '../singletons';

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
  public toolName = ETool.Point;

  constructor(params: PointToolOptions) {
    super({
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

    // this.createDrawing();

    this._init();
  }

  private _init() {
    const { data = [] } = this;

    for (const annotation of data) {
      this.addAnnotation(annotation);
    }
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

  public onSelect = (_e: MouseEvent, annotation: AnnotationPoint) => {
    const { selectedStyle, style } = this;

    this.draft = new AnnotationPoint({
      id: annotation.id,
      data: annotation.data,
      style: { ...style, ...selectedStyle },
      onPick: this.onPick,
      onUnSelect: this.onUnSelect,
      onMove: this.onMove,
      onMoveEnd: this.onMoveEnd,
    });

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

  public onUnSelect = (_e: MouseEvent, annotation: AnnotationPoint) => {
    this.addAnnotation(annotation.data);
    this.draft?.destroy();
    // 重新渲染
    axis!.rerender();
  };

  /**
   * 移动选中的点
   */
  public onMove = (_e: MouseEvent) => {
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

  public onMoveEnd = () => {
    this.previousCoordinates = this.getCoordinates();
  };

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);
  }
}
