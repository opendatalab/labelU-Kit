import type { LineTool } from '../tools/Line.tool';
import type { BasicImageAnnotation } from '../interface';
import type { PointItem } from '../drawing/Line.drawing';
import { Annotation } from './Annotation.abstract';
import type { Line } from '../shape/Line.shape';
import type { AxisPoint } from '../shape/Point.shape';
import { Group } from '../shape/Group';

export interface LineData extends BasicImageAnnotation {
  pointList: PointItem[];
}

export class AnnotationPoint extends Annotation<LineData, LineTool> {
  /**
   * Rbush 碰撞检测阈值
   *
   * TODO: 阈值是否可配置
   */
  static DISTANCE_THRESHOLD = 2 as const;

  public data: LineData;

  public tool: LineTool;

  public id: string;

  public group = new Group('22');

  private _isHovered: boolean = false;

  private _isSelected: boolean = false;

  private _elementMapping: Map<string, Line> = new Map();

  constructor(id: string, data: LineData, tool: LineTool) {
    super();

    this.id = id;
    this.data = data;
    this.tool = tool;
  }

  /**
   * 获取在鼠标指针下的标注id
   * NOTE: 目前先支持获取一个标注
   * @param mouseCoord 鼠标坐标
   * @param rbushItems rbushItems
   * @returns 标注id
   */
  public isUnderCursor(mouseCoord: AxisPoint, lines: Line[]) {
    if (lines.length === 0) {
      return;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    this.group.render(ctx);
  }

  public destroy() {
    const { group } = this;

    group.destroy();
  }

  public get isHovered() {
    return this._isHovered;
  }

  public get isSelected() {
    return this._isSelected;
  }

  public get shapes() {
    return Array.from(this._elementMapping.values());
  }

  public get elementMapping() {
    return this._elementMapping;
  }
}
