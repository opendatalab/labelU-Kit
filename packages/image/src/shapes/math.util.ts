import type { AxisPoint } from './Point.shape';

/**
 * 获取两点之间的距离
 *
 * @param start 起始点
 * @param end 结束点
 */
export function getDistance(start: AxisPoint, end: AxisPoint) {
  const { x: x1, y: y1 } = start;
  const { x: x2, y: y2 } = end;

  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

/**
 * 获取点到线的距离
 *
 * @param point 点
 * @param line 线
 * @returns 点到线的距离
 */
export function getDistanceToLine(point: AxisPoint, start: AxisPoint, end: AxisPoint) {
  if (!start || !end) {
    throw Error('Line not found!');
  }

  const { x: x3, y: y3 } = point;

  const px = end.x - start.x;
  const py = end.y - start.y;
  const something = px * px + py * py;
  const u = ((x3 - start.x) * px + (y3 - start.y) * py) / something;

  if (u > 1) {
    return getDistance(point, end);
  }

  if (u < 0) {
    return getDistance(point, start);
  }

  const x = start.x + u * px;
  const y = start.y + u * py;

  return getDistance(point, { x, y });
}

/**
 * 判断点是否在多边形内
 *
 * @param point 点
 * @param polygonCoordinate 多边形坐标
 */
export function isPointInPolygon(point: AxisPoint, polygonCoordinate: AxisPoint[]) {
  const { x, y } = point;

  let inside = false;

  for (let i = 0, j = polygonCoordinate.length - 1; i < polygonCoordinate.length; j = i++) {
    const xi = polygonCoordinate[i].x;
    const yi = polygonCoordinate[i].y;
    const xj = polygonCoordinate[j].x;
    const yj = polygonCoordinate[j].y;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}
