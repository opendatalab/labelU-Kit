import type { BasicImageAnnotation } from '../interface';
import { Annotation } from './Annotation';
import type { Line } from '../shape/Line.shape';
import { Point } from '../shape/Point.shape';
import type { AxisPoint, PointStyle } from '../shape/Point.shape';
import { Group } from '../shape/Group';
import type { RBushItem } from '../singletons';
import { eventEmitter } from '../singletons';
import { Hover } from '../decorators/Hover.decorator';
import { getDistance } from '../shape/math.util';

export type PointData = BasicImageAnnotation & AxisPoint;

@Hover
export class AnnotationPoint extends Annotation<PointData, PointStyle> {
  /**
   * Rbush 碰撞检测阈值
   *
   * TODO: 阈值是否可配置
   */
  static DISTANCE_THRESHOLD = 2 as const;

  public group: Group<Point, PointStyle>;

  public effectedStyles: string[] = ['fill'];

  private _isHovered: boolean = false;

  private _elementMapping: Map<string, Line> = new Map();

  constructor(id: string, data: PointData, style: PointStyle, hoveredStyle?: PointStyle) {
    super(id, data, style, hoveredStyle);

    this.group = new Group(id);

    this._setupShapes();
  }

  private _setupShapes() {
    const { data, style, group } = this;

    const point = new Point(data.id, data, style);

    group.add(point);

    this._elementMapping.set(point.id, point);
  }

  public onMouseOver = (e: MouseEvent, rbushItems: RBushItem[], mouseCoord: AxisPoint) => {
    const { group, style } = this;

    const shapes = rbushItems.filter((item) => group.get(item.id)).map((item) => group.get(item.id));

    if (this.isUnderCursor(mouseCoord, shapes as Point[])) {
      this._isHovered = true;
      eventEmitter.emit('hover', e, this.data);
    } else {
      this._isHovered = false;
      this.hovered = false;
      group.updateStyle(style);
    }
  };

  public onHover = (annotation: AnnotationPoint) => {
    const { group, style, hoveredStyle } = this;

    if (annotation.id === this.id) {
      this.hovered = true;
      group.updateStyle({ ...style, ...hoveredStyle });
    } else {
      this.hovered = false;
    }
  };

  /**
   * 获取在鼠标指针下的标注id
   * NOTE: 目前先支持获取一个标注
   * @param mouseCoord 鼠标坐标
   * @param rbushItems rbushItems
   * @returns 标注id
   */
  public isUnderCursor(mouseCoord: AxisPoint, points: Point[]) {
    const { group, style } = this;

    if (points.length === 0) {
      return;
    }

    for (let i = 0; i < points.length; i += 1) {
      const item = points[i];

      if (!item) {
        throw Error(`Line at [${i}] in lines is undefined!`);
      }

      const distance = getDistance(mouseCoord, item.dynamicCoordinate[0]);

      if (distance < AnnotationPoint.DISTANCE_THRESHOLD + ((style.radius ?? 0) + (style.strokeWidth ?? 0)) / 2) {
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
