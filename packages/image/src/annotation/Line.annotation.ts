import type { BasicImageAnnotation } from '../interface';
import { Annotation } from './Annotation';
import type { LineStyle } from '../shape/Line.shape';
import { Line } from '../shape/Line.shape';
import type { AxisPoint } from '../shape/Point.shape';
import type { RBushItem } from '../singletons';
import { eventEmitter } from '../singletons';
import { Group } from '../shape/Group';
import { getDistanceToLine } from '../shape/math.util';
import { Hover } from '../decorators/Hover.decorator';

export interface PointItem extends AxisPoint {
  id: string;
}

export interface LineData extends BasicImageAnnotation {
  pointList: PointItem[];
}

@Hover
export class AnnotationLine extends Annotation<LineData, LineStyle> {
  /**
   * Rbush 碰撞检测阈值
   *
   * TODO: 阈值是否可配置
   */
  static DISTANCE_THRESHOLD = 2 as const;

  public group: Group<Line, LineStyle>;

  /**
   * 最后悬浮的标注
   */
  public hovered: boolean = false;

  /**
   * 鼠标悬浮标识
   *
   * @description 交叉的图形都将是true，最终根据order排序，取最后一个，即 hovered = true
   *
   * @see hovered
   */
  private _isHovered: boolean = false;

  constructor(id: string, data: LineData, style: LineStyle, hoveredStyle?: LineStyle) {
    super(id, data, style, hoveredStyle);

    this.group = new Group(id);

    this._setupShapes();

    console.log('line style', style);
  }

  private _setupShapes() {
    const { data, group, style } = this;

    for (let i = 1; i < data.pointList.length; i++) {
      const startPoint = data.pointList[i - 1];
      const endPoint = data.pointList[i];

      const line = new Line(startPoint.id, [startPoint, endPoint], style);

      group.add(line);
    }
  }

  public onMouseOver = (e: MouseEvent, rbushItems: RBushItem[], mouseCoord: AxisPoint) => {
    const { group, style } = this;

    const shapes = rbushItems.filter((item) => group.get(item.id)).map((item) => group.get(item.id));

    if (this.isUnderCursor(mouseCoord, shapes as Line[])) {
      this._isHovered = true;
      eventEmitter.emit('hover', e, this.data);
    } else {
      this._isHovered = false;
      this.hovered = false;
      group.updateStyle(style);
    }
  };

  public onHover = (annotation: AnnotationLine) => {
    const { group, style, hoveredStyle } = this;

    if (annotation.id === this.id) {
      this.hovered = true;
      group.updateStyle({
        ...style,
        ...(hoveredStyle ?? {}),
      });
    } else {
      this.hovered = false;
      group.updateStyle(style);
    }
  };

  /**
   * 获取在鼠标指针下的标注id
   * NOTE: 目前先支持获取一个标注
   * @param mouseCoord 鼠标坐标
   * @param rbushItems rbushItems
   * @returns 标注id
   */
  public isUnderCursor(mouseCoord: AxisPoint, lines: Line[]) {
    const { group, style } = this;

    if (lines.length === 0) {
      return;
    }

    for (let i = 0; i < lines.length; i += 1) {
      const item = lines[i];

      if (!item) {
        throw Error(`Line at [${i}] in lines is undefined!`);
      }

      const distance = getDistanceToLine(mouseCoord, item);

      if (distance < AnnotationLine.DISTANCE_THRESHOLD + (style.strokeWidth ?? 0) / 2) {
        const annotationId = group.get(item.id);

        if (!annotationId) {
          throw Error(`Annotation not found! point id is ${item.id} `);
        }

        return annotationId;
      }
    }
  }

  public get bbox() {
    return this.group.bbox;
  }

  public render(ctx: CanvasRenderingContext2D) {
    this.group.render(ctx);
  }

  public destroy() {
    super.destroy();
    this.group.destroy();
  }

  public get isHovered() {
    return this._isHovered;
  }
}
