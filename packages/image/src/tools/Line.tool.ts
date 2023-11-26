import type { ILabel } from '@labelu/interface';

import type { LineStyle } from '../shape/Line.shape';
import { Line } from '../shape/Line.shape';
import { ETool } from '../enums';
import { Tool } from './Tool';
import { LinePen } from '../pen';
import type { LineData, LineToolOptions } from '../drawing/Line.drawing';
import { LineDrawing } from '../drawing/Line.drawing';
import type { AnnotationLine } from '../annotation';

export class LineTool extends Tool<LineData, LineStyle, LineToolOptions, AnnotationLine> {
  /**
   * Rbush 碰撞检测阈值
   *
   * TODO: 阈值是否可配置
   */
  static DISTANCE_THRESHOLD = 2 as const;

  public toolName = ETool.Line;

  public style: Required<LineStyle> = Line.DEFAULT_STYLE;

  /** 按线段分组id对标注的映射 */
  private _annotationToLineMapping: Map<string, Line[]> = new Map();

  /** 线段端点对标注id的映射 */
  private _pointToAnnotationMapping: Map<string, string> = new Map();

  /** 端点对线段的映射 */
  private _pointToLineMapping: Map<string, Line> = new Map();

  public drawing: LineDrawing | null = null;

  public pen: LinePen<LineTool> | null = null;

  /**
   * TODO: 高亮样式
   *
   * @default stroke: '#f60', strokeWidth: 4
   */
  public hoveredStyle: LineStyle = {
    stroke: '#f60',
    strokeWidth: 4,
  };

  constructor(params: LineToolOptions) {
    super(params);

    this.createDrawing();
  }

  /**
   * 创建成品图形
   *
   * @description 非编辑状态下的成品图形
   *
   * 调用时机：
   * 1. 当结束编辑后，调用此方法；
   * 2. 当切换工具时，调用此方法；
   * 3. 当初始化画面时，调用此方法；
   */
  public createDrawing(data?: LineData[]) {
    if (data) {
      this.data = data;
    }

    const { data: _data } = this;

    if (!Array.isArray(_data)) {
      throw Error('Data must be an array!');
    }

    this.drawing = new LineDrawing(_data, this);
  }

  /**
   * 创建绘制器
   */
  public switchToPen(label: string | ILabel) {
    this.pen = new LinePen(this, label);
  }

  public render(ctx: CanvasRenderingContext2D) {
    const { drawing, pen } = this;

    if (drawing) {
      drawing.render(ctx);
    }

    if (pen) {
      pen.render(ctx);
    }
  }

  public destroy() {
    super.destroy();

    this._annotationToLineMapping.clear();
    this._pointToAnnotationMapping.clear();
    this._pointToLineMapping.clear();
    this.pen?.destroy();
    this.drawing?.destroy();
    this.pen = null;
    this.drawing = null;
  }
}
