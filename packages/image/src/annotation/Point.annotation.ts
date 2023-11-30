import type { BasicImageAnnotation } from '../interface';
import { Annotation } from './Annotation';
import { Point } from '../shape/Point.shape';
import type { AxisPoint, PointStyle } from '../shape/Point.shape';
import { Hover } from '../decorators/Hover.decorator';

export type PointData = BasicImageAnnotation & AxisPoint;

@Hover
export class AnnotationPoint extends Annotation<PointData, Point, PointStyle> {
  constructor(id: string, data: PointData, style: PointStyle, hoveredStyle?: PointStyle) {
    super(id, data, style, hoveredStyle);

    this._setupShapes();
  }

  private _setupShapes() {
    const { data, style, group } = this;

    const point = new Point(data.id, data, style);

    group.add(point);
  }

  public get bbox() {
    return this.group.bbox;
  }

  public render(ctx: CanvasRenderingContext2D) {
    this.group.render(ctx);
  }

  public destroy() {
    super.destroy();
  }
}
