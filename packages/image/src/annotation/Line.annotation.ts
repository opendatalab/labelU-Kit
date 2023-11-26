import type { LineTool } from '../tools/Line.tool';
import type { BasicImageAnnotation } from '../interface';
import type { PointItem } from '../drawing/Line.drawing';
import { Annotation } from './Annotation.abstract';
import type { LineStyle } from '../shape/Line.shape';
import { Line } from '../shape/Line.shape';
import { EInternalEvent } from '../enums';
import type { AxisPoint } from '../shape/Point.shape';
import type { RBushItem } from '../singletons';
import { eventEmitter } from '../singletons';
import { Group } from '../shape/Group';
import { getDistanceToLine } from '../shape/math.util';

export interface LineData extends BasicImageAnnotation {
  pointList: PointItem[];
}

export class AnnotationLine extends Annotation<LineData, LineTool> {
  /**
   * Rbush 碰撞检测阈值
   *
   * TODO: 阈值是否可配置
   */
  static DISTANCE_THRESHOLD = 2 as const;

  public data: LineData;

  public tool: LineTool;

  public group: Group<Line, LineStyle>;

  public id: string;

  /**
   * 最后悬浮的标注
   */
  public hovered: boolean = false;

  public selected: boolean = false;

  /**
   * 鼠标悬浮标识
   *
   * @description 交叉的图形都将是true，最终根据order排序，取最后一个，即 hovered = true
   *
   * @see hovered
   */
  private _isHovered: boolean = false;

  constructor(id: string, data: LineData, tool: LineTool) {
    super();

    this.id = id;
    this.data = data;
    this.tool = tool;
    this.group = new Group(id);

    this._setupShapes();

    eventEmitter.on(EInternalEvent.Hover, this._handleHover.bind(this));
    eventEmitter.on(EInternalEvent.Move, this._handleMouseOver.bind(this));
  }

  private _setupShapes() {
    const { data, group } = this;

    for (let i = 1; i < data.pointList.length; i++) {
      const startPoint = data.pointList[i - 1];
      const endPoint = data.pointList[i];

      const line = new Line(startPoint.id, [startPoint, endPoint], this._getStyle());

      group.add(line);
    }
  }

  private _handleMouseOver(e: MouseEvent, rbushItems: RBushItem[], mouseCoord: AxisPoint) {
    const { group } = this;

    const shapes = rbushItems.filter((item) => group.get(item.id)).map((item) => group.get(item.id));

    if (this.isUnderCursor(mouseCoord, shapes as Line[])) {
      this._isHovered = true;
      eventEmitter.emit('hover', e, this.data);
    } else {
      this._isHovered = false;
      this.hovered = false;
    }
  }

  private _handleHover(annotation: AnnotationLine) {
    if (annotation.id === this.id) {
      this.hovered = true;
    } else {
      this.hovered = false;
    }
  }

  /**
   * 获取在鼠标指针下的标注id
   * NOTE: 目前先支持获取一个标注
   * @param mouseCoord 鼠标坐标
   * @param rbushItems rbushItems
   * @returns 标注id
   */
  public isUnderCursor(mouseCoord: AxisPoint, lines: Line[]) {
    const { group } = this;
    const { style } = this.tool;

    if (lines.length === 0) {
      return;
    }

    for (let i = 0; i < lines.length; i += 1) {
      const item = lines[i];

      if (!item) {
        throw Error(`Line at [${i}] in lines is undefined!`);
      }

      const distance = getDistanceToLine(mouseCoord, item);

      if (distance < AnnotationLine.DISTANCE_THRESHOLD + style.strokeWidth / 2) {
        const annotationId = group.get(item.id);

        if (!annotationId) {
          throw Error(`Annotation not found! point id is ${item.id} `);
        }

        return annotationId;
      }
    }
  }

  private _getStyle() {
    const { data, tool, hovered } = this;
    const { style } = tool;

    if (hovered) {
      return tool.hoveredStyle;
    }

    return {
      ...style,
      stroke: tool.getLabelByValue(data.label)?.color || style.stroke,
    };
  }

  public getBBox() {
    return this.group.bbox;
  }

  public render(ctx: CanvasRenderingContext2D) {
    const { group } = this;

    group.updateStyle(this._getStyle());
    group.render(ctx);
  }

  public destroy() {
    const { group } = this;

    group.destroy();

    eventEmitter.off(EInternalEvent.Hover, this._handleHover.bind(this));
  }

  public get isHovered() {
    return this._isHovered;
  }
}
