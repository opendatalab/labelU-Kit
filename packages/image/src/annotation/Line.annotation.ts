import type { BasicImageAnnotation } from '../interface';
import { Annotation } from './Annotation';
import type { LineStyle } from '../shape/Line.shape';
import { Line } from '../shape/Line.shape';
import type { AxisPoint } from '../shape/Point.shape';
import { Hover } from '../decorators/Hover.decorator';

export interface PointItem extends AxisPoint {
  id: string;
}

export interface LineData extends BasicImageAnnotation {
  pointList: PointItem[];
}

@Hover
export class AnnotationLine extends Annotation<LineData, Line, LineStyle> {
  constructor(id: string, data: LineData, style: LineStyle, hoveredStyle?: LineStyle) {
    super(id, data, style, hoveredStyle);

    this._setupShapes();
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

  public get bbox() {
    return this.group.bbox;
  }

  public render(ctx: CanvasRenderingContext2D) {
    this.group.render(ctx);
  }
}
