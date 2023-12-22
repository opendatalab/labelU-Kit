import type { BBox } from 'rbush';

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

/**
 * 获取点到两点间的最近点
 *
 * @param point 点
 * @param start 起始点
 * @param end 结束点
 * @returns 点到两点间的最近点
 */
export function getLatestPointOnLine(point: AxisPoint, start: AxisPoint, end: AxisPoint) {
  if (!start || !end) {
    throw Error('Line not found!');
  }

  if (!point) {
    throw Error('Point not found!');
  }

  if (start.x === end.x && start.y === end.y) {
    return start;
  }

  if (point.x === start.x && point.y === start.y) {
    return start;
  }

  if (point.x === end.x && point.y === end.y) {
    return end;
  }

  // 计算向量 AB 和 AP
  const AB = { x: end.x - start.x, y: end.y - start.y };
  const AP = { x: point.x - start.x, y: point.y - start.y };

  // 计算点积
  const dotProduct = AB.x * AP.x + AB.y * AP.y;
  const squareLengthAB = AB.x * AB.x + AB.y * AB.y;

  let pointOnLine; // 线段上离鼠标最近的点

  if (dotProduct < 0) {
    pointOnLine = start;
  } else if (dotProduct > squareLengthAB) {
    pointOnLine = end;
  } else {
    const ratio = dotProduct / squareLengthAB;
    pointOnLine = {
      x: start.x + ratio * AB.x,
      y: start.y + ratio * AB.y,
    };
  }

  return pointOnLine;
}

/**
 * 判定两个矩形是否相交
 *
 * @param bbox1 矩形1
 * @param bbox2 矩形2
 */
export function isBBoxIntersect(bbox1: BBox, bbox2: BBox) {
  const { minX: minX1, minY: minY1, maxX: maxX1, maxY: maxY1 } = bbox1;
  const { minX: minX2, minY: minY2, maxX: maxX2, maxY: maxY2 } = bbox2;

  return !(minX2 > maxX1 || maxX2 < minX1 || minY2 > maxY1 || maxY2 < minY1);
}

/**
 * 用一个多边形减去多个多边形，生成新的多边形
 *
 * @param source 被减数
 * @param targets 减数
 * @returns Promise 差集
 */
export async function generatePolygonsFromDifference(source: AxisPoint[], targets: AxisPoint[][]) {
  const sourcePolygon = source.map((point) => [point.x, point.y]);
  const targetPolygons = targets.map((target) => [target.map((point) => [point.x, point.y])]);

  // @ts-ignore
  return import('polygon-clipping').then(({ default: polygonClipping }) => {
    return polygonClipping.difference([sourcePolygon] as any, targetPolygons as any);
  });
}
