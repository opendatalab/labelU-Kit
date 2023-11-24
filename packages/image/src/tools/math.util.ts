import type { AxisPoint } from '../graphics/Point';

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
