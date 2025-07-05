import cloneDeep from 'lodash.clonedeep';

import { Shape } from './Shape';
import { getDistanceToLine } from './math.util';
import { DEFAULT_LABEL_COLOR } from '../constant';
import type { AxisPoint } from './Point.shape';

export interface LineStyle {
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  /** 线条样式：实线或虚线 */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** 虚线模式，数组表示实线和虚线的长度交替 */
  dashPattern?: number[];
  /** 是否显示箭头 */
  arrowType?: 'single' | 'double' | 'none';
  /** 箭头头部长度 */
  headLength?: number;
  /** 箭头头部角度（弧度） */
  headAngle?: number;
}

export type LineCoordinate = [
  /** 起始点 */
  AxisPoint,
  /** 结束点 */
  AxisPoint,
];

export interface LineParams {
  id: string;
  coordinate: LineCoordinate;
  style?: LineStyle;
}

export class Line extends Shape<LineStyle> {
  /**
   * Rbush 碰撞检测阈值
   */
  static DISTANCE_THRESHOLD = 2 as const;

  static DEFAULT_STYLE: Required<LineStyle> = {
    stroke: DEFAULT_LABEL_COLOR,
    strokeWidth: 2,
    opacity: 1,
    /**
     * 线条样式：实线或虚线
     */
    lineStyle: 'solid',
    /**
     * 虚线模式，数组表示实线和虚线的长度交替
     */
    dashPattern: [5, 5],
    /**
     * 箭头类型：单向箭头、双向箭头
     */
    arrowType: 'none',
    headLength: 15,
    headAngle: Math.PI / 6, // 30度
  };

  public style: Required<LineStyle> = Line.DEFAULT_STYLE;

  constructor({ id, coordinate, style }: LineParams) {
    super(id, coordinate);

    if (style) {
      this.style = { ...this.style, ...style };
    }
  }

  public serialize() {
    const { id, style, plainCoordinate, dynamicCoordinate } = this;

    return {
      id,
      coordinate: cloneDeep(plainCoordinate),
      dynamicCoordinate: cloneDeep(dynamicCoordinate),
      style,
    };
  }

  /**
   * 是否在鼠标指针下
   *
   * @param mouseCoord 鼠标坐标
   */
  public isUnderCursor(mouseCoord: AxisPoint) {
    const { style, dynamicCoordinate } = this;

    const distance = getDistanceToLine(mouseCoord, dynamicCoordinate[0], dynamicCoordinate[1]);

    if (distance < Line.DISTANCE_THRESHOLD + (style.strokeWidth ?? 0) / 2) {
      return true;
    }

    return false;
  }

  /**
   * 计算箭头头部的三个点
   */
  private calculateArrowHead(start: AxisPoint, end: AxisPoint) {
    const { headLength, headAngle } = this.style;

    // 计算箭头方向向量
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return { tip: end, left: end, right: end };

    // 单位向量
    const unitX = dx / length;
    const unitY = dy / length;

    // 箭头尖端
    const tip = { x: end.x, y: end.y };

    // 计算箭头头部的两个角点
    const leftAngle = Math.atan2(unitY, unitX) + headAngle;
    const rightAngle = Math.atan2(unitY, unitX) - headAngle;

    const left = {
      x: end.x - headLength * Math.cos(leftAngle),
      y: end.y - headLength * Math.sin(leftAngle),
    };

    const right = {
      x: end.x - headLength * Math.cos(rightAngle),
      y: end.y - headLength * Math.sin(rightAngle),
    };

    return { tip, left, right };
  }

  public getLineInfo() {
    const angle = Math.atan2(
      this.dynamicCoordinate[1].y - this.dynamicCoordinate[0].y,
      this.dynamicCoordinate[1].x - this.dynamicCoordinate[0].x,
    );
    const rotate = angle * (180 / Math.PI);
    const centerX = (this.dynamicCoordinate[0].x + this.dynamicCoordinate[1].x) / 2;
    const centerY = (this.dynamicCoordinate[0].y + this.dynamicCoordinate[1].y) / 2;

    return { angle, rotate, centerX, centerY };
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, dynamicCoordinate } = this;
    const { stroke, strokeWidth, opacity, arrowType, lineStyle, dashPattern } = style;
    const [start, end] = dynamicCoordinate;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;

    // 设置线条样式
    if (lineStyle === 'dashed') {
      ctx.setLineDash(dashPattern);
    } else if (lineStyle === 'dotted') {
      ctx.setLineDash([2, 2]);
    } else {
      // solid
      ctx.setLineDash([]);
    }

    // 绘制线条
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // 如果启用箭头，绘制箭头头部
    if (arrowType === 'single') {
      ctx.fillStyle = stroke;
      const arrowHead = this.calculateArrowHead(start, end);

      ctx.beginPath();
      ctx.moveTo(arrowHead.tip.x, arrowHead.tip.y);
      ctx.lineTo(arrowHead.left.x, arrowHead.left.y);
      ctx.lineTo(arrowHead.right.x, arrowHead.right.y);
      ctx.closePath();
      ctx.fill();
    } else if (arrowType === 'double') {
      ctx.fillStyle = stroke;

      // 绘制终点箭头
      const endArrowHead = this.calculateArrowHead(start, end);
      ctx.beginPath();
      ctx.moveTo(endArrowHead.tip.x, endArrowHead.tip.y);
      ctx.lineTo(endArrowHead.left.x, endArrowHead.left.y);
      ctx.lineTo(endArrowHead.right.x, endArrowHead.right.y);
      ctx.closePath();
      ctx.fill();

      // 绘制起点箭头
      const startArrowHead = this.calculateArrowHead(end, start);
      ctx.beginPath();
      ctx.moveTo(startArrowHead.tip.x, startArrowHead.tip.y);
      ctx.lineTo(startArrowHead.left.x, startArrowHead.left.y);
      ctx.lineTo(startArrowHead.right.x, startArrowHead.right.y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
