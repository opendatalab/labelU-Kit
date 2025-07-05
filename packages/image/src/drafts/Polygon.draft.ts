import cloneDeep from 'lodash.clonedeep';
import Color from 'color';

import uid from '@/utils/uid';

import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import { AnnotationPolygon, type PolygonData } from '../annotations';
import type { Group, PointStyle, PolygonStyle } from '../shapes';
import { Polygon } from '../shapes';
import { axis, eventEmitter, monitor, rbush } from '../singletons';
import type { AnnotationParams } from '../annotations/Annotation';
import { Annotation } from '../annotations/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { Draft } from './Draft';
import { ControllerEdge } from './ControllerEdge';
import type { PolygonTool, PolygonToolOptions } from '../tools';
import { EInternalEvent } from '../enums';
import { generatePolygonsFromDifference, getLatestPointOnLine, isBBoxIntersect } from '../shapes/math.util';
import { Tool } from '../tools/Tool';

export class DraftPolygon extends Draft<PolygonData, PolygonStyle | PointStyle | LineStyle> {
  public config: PolygonToolOptions;

  private _pointIndex: number | null = null;

  private _effectedLines: [Line | undefined, Line | undefined] | null = null;

  /**
   * 拖动控制边的时候受影响的控制点
   */
  private _effectedControllerPoints: ControllerPoint[] = [];

  /**
   * 拖动控制边的时候受影响的其他控制边和端点下标
   *
   * @description [edge, current edge point index, effected edge point index]
   */
  private _effectedControllerEdges: [ControllerEdge, number, number][] = [];

  /**
   * 拖动控制边的时候受影响的多边形坐标索引
   *
   * @description [current edge point index, coordinate index]
   */
  private _effectedCoordinateIndexes: [number, number][] = [];

  private _pointToBeAdded: ControllerPoint | null = null;

  /**
   * 工具引用，用于获取所有多边形
   */
  private _tool: PolygonTool;

  constructor(config: PolygonToolOptions, params: AnnotationParams<PolygonData, PolygonStyle>, tool: PolygonTool) {
    super({ ...params, name: 'polygon', labelColor: AnnotationPolygon.labelStatic.getLabelColor(params.data.label) });

    this.config = config;
    this._tool = tool;

    this._setupShapes();
    this.onMouseUp(this._onMouseUp);

    eventEmitter.on(EInternalEvent.KeyDown, this._onKeyDown);
    eventEmitter.on(EInternalEvent.KeyUp, this._onKeyUp);
    this.finishSetup();
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style, config, labelColor, strokeColor } = this;

    group.add(
      // 多边形用于颜色填充
      new Polygon({
        id: data.id,
        coordinate: cloneDeep(data.points),
        style: {
          ...style,
          strokeWidth: 0,
          stroke: 'transparent',
          fill: Color(labelColor).alpha(Annotation.fillOpacity).toString(),
          opacity: 0.5,
        },
      }),
    );

    // 多线段用于控制多边形的边
    const fullPoints = [...data.points, data.points[0]];

    for (let i = 1; i < fullPoints.length; i++) {
      const startPoint = fullPoints[i - 1];
      const endPoint = fullPoints[i];

      const edge = new ControllerEdge({
        id: uid(),
        coordinate: cloneDeep([startPoint, endPoint]),
        disabled: !this.requestEdit('update'),
        style: {
          ...style,
          stroke: strokeColor,
          strokeWidth: Annotation.strokeWidth,
        },
      });

      edge.onMouseDown(this._onEdgeDown);
      edge.onMove(this._onEdgeMove);
      edge.onMouseUp(this._onEdgeUp);

      edge.on(EInternalEvent.ShapeOver, this._onLineOver);

      group.add(edge);
    }

    // 点要覆盖在线上
    for (let i = 0; i < data.points.length; i++) {
      const pointItem = data.points[i];
      const point = new ControllerPoint({
        id: uid(),
        outOfImage: config.outOfImage,
        disabled: !this.requestEdit('update'),
        // 深拷贝，避免出现引用问题
        coordinate: cloneDeep(pointItem),
      });

      point.onMouseDown(this._onControllerPointDown);
      point.onMove(this._onControllerPointMove);
      point.onMouseUp(this._onControllerPointUp);

      group.add(point);
    }
  }

  /**
   * 按下键盘
   *
   * @description
   * 1. 按下 alt + x，减去跟其他多边形重合的部分
   */
  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyX' && e.altKey) {
      e.preventDefault();
      this._cutPolygon();
    }
  };

  /**
   * 减去跟其他多边形重合的部分
   */
  private async _cutPolygon() {
    // 找出有交集的其他多边形
    const groups: Group[] = [];
    const polygon = this.group.shapes[0] as Polygon;

    this._tool.drawing?.forEach((annotation) => {
      if (annotation.group.id !== this.group.id && isBBoxIntersect(polygon.bbox, annotation.group.bbox)) {
        groups.push(annotation.group);
      }
    });

    // 从多边形中减去跟其他多边形重合的部分
    const polygons = await generatePolygonsFromDifference(
      polygon.dynamicCoordinate,
      groups.map((group) => {
        return (group.shapes[0] as Polygon).dynamicCoordinate;
      }),
    );

    if (polygons.length > 0) {
      const firstPolygon = polygons.shift();
      // NOTE: 生成的多边形坐标最后一个点和第一个点是重复的，需要删除
      firstPolygon![0].pop();
      // 第一个多边形使用当前多边形的id
      this.data.points = firstPolygon![0].map((item: number[]) => {
        return {
          id: uid(),
          ...axis!.getOriginalCoord({
            x: item[0],
            y: item[1],
          }),
        };
      });
      // 更新当前草稿
      this.group.clear();
      this._setupShapes();
      // 创建新的多边形标注
      const newAnnotationsData = polygons.map((items, index) => {
        // NOTE: 生成的多边形坐标最后一个点和第一个点是重复的，需要删除
        items[0].pop();

        return {
          ...cloneDeep(this.data),
          id: uid(),
          order: monitor!.getMaxOrder() + index + 1,
          points: items[0].map((item: number[]) => {
            return {
              id: uid(),
              ...axis!.getOriginalCoord({
                x: item[0],
                y: item[1],
              }),
            };
          }),
        };
      });
      this._tool.createAnnotationsFromData(newAnnotationsData);
      axis?.rerender();
      Tool.onAdd(
        newAnnotationsData.map((item) => ({
          ...item,
          points: item.points.map((point) => axis!.convertCanvasCoordinate(point)),
        })),
      );
    }
  }

  private _onKeyUp = () => {
    this._removeTempPoint();
  };

  private _onLineOver = (_e: MouseEvent, line: Line) => {
    const { config, group, _pointToBeAdded } = this;

    // 只有按下 alt 键时，才能在线段上增加控制点
    if (!monitor?.keyboard.Alt || !this.requestEdit('update')) {
      return;
    }

    const latestPointOnLine = getLatestPointOnLine(
      {
        x: _e.offsetX,
        y: _e.offsetY,
      },
      line.dynamicCoordinate[0],
      line.dynamicCoordinate[1],
    );

    // 如果存在则只更新坐标
    if (_pointToBeAdded) {
      _pointToBeAdded.coordinate[0] = axis!.getOriginalCoord(latestPointOnLine);
    } else {
      // 往线上添加点
      const point = new ControllerPoint({
        // name存储线段的索引
        name: group.shapes.indexOf(line).toString(),
        id: uid(),
        disabled: !this.requestEdit('update'),
        coordinate: axis!.getOriginalCoord(latestPointOnLine),
        outOfImage: config.outOfImage,
      });

      point.on(EInternalEvent.ShapeOut, () => {
        this._removeTempPoint();
      });
      point.onMouseDown(this._onControllerPointDown);

      this._pointToBeAdded = point;

      group.add(point);
    }
  };

  private _removeTempPoint() {
    const { group, _pointToBeAdded } = this;

    // 松开鼠标右键时，删除待添加的控制点
    if (_pointToBeAdded) {
      group.remove(_pointToBeAdded);
      this._pointToBeAdded = null;
      axis?.rerender();
    }
  }

  private _onMouseUp = () => {
    this.syncCoordToData();
  };

  /**
   * 按下控制点
   * @param point
   * @description 按下控制点时，记录受影响的线段
   */
  private _onControllerPointDown = (point: ControllerPoint) => {
    const { data, _pointToBeAdded, group, config } = this;
    // 插入控制点
    if (_pointToBeAdded) {
      // 校验点的个数
      if (group.shapes[0].coordinate.length + 1 > config.maxPointAmount!) {
        Tool.error({
          type: 'maxPointAmount',
          message: `At most ${config.maxPointAmount} points are allowed`,
          value: config.maxPointAmount,
        });

        return;
      }

      const insertIndex = Number(_pointToBeAdded.name);
      // 先往data里增加一个点
      data.points.splice(insertIndex, 0, {
        id: _pointToBeAdded.id,
        x: _pointToBeAdded.coordinate[0].x,
        y: _pointToBeAdded.coordinate[0].y,
      });
      group.clear();
      this._setupShapes();
      this._pointToBeAdded = null;
      axis?.rerender();

      eventEmitter.emit('change');

      return;
    }

    // 删除端点
    if (monitor?.keyboard.Alt) {
      // 少于两个点或少于配置的最少点数时，不允许删除
      if (data.points.length <= config.minPointAmount!) {
        Tool.error({
          type: 'minPointAmount',
          message: `At least ${config.minPointAmount} points are required`,
          value: config.minPointAmount,
        });

        return;
      }
      const deleteIndex = group.shapes.indexOf(point) - data.points.length - 1;
      data.points.splice(deleteIndex, 1);
      group.clear();
      this._setupShapes();
      axis?.rerender();

      eventEmitter.emit('change');

      return;
    }

    this._effectedLines = [undefined, undefined];
    this._pointIndex = this.group.shapes[0].coordinate.findIndex(
      (item) => item.x === point.coordinate[0].x && item.y === point.coordinate[0].y,
    );

    this.group.each((shape) => {
      if (shape instanceof Line) {
        if (
          shape.dynamicCoordinate[0].x === point.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[0].y === point.dynamicCoordinate[0].y
        ) {
          // 线段的起点
          this._effectedLines![0] = shape;
        }
        if (
          shape.dynamicCoordinate[1].x === point.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[1].y === point.dynamicCoordinate[0].y
        ) {
          // 线段的终点
          this._effectedLines![1] = shape;
        }
      }
    });
  };

  /**
   * 移动控制点
   * @param changedCoordinate
   * @description 控制点移动时，更新线段的端点
   */
  private _onControllerPointMove = ({ coordinate }: ControllerPoint, e: MouseEvent) => {
    const { _pointIndex, _effectedLines, config } = this;

    if (_pointIndex === null || !_effectedLines) {
      return;
    }

    let x = coordinate[0].x;
    let y = coordinate[0].y;

    const latestPoint =
      config.edgeAdsorptive &&
      rbush.scanPolygonsAndSetNearestPoint(
        {
          x: e.offsetX,
          y: e.offsetY,
        },
        10,
        [this.group.id],
      );

    if (latestPoint) {
      x = latestPoint.x;
      y = latestPoint.y;
      coordinate[0].x = x;
      coordinate[0].y = y;
    }

    this.group.shapes[0].coordinate[_pointIndex].x = x;
    this.group.shapes[0].coordinate[_pointIndex].y = y;

    // 更新受影响的线段端点
    if (_effectedLines[1] === undefined && _effectedLines[0]) {
      _effectedLines[0].coordinate = [{ x, y }, { ..._effectedLines[0].coordinate[1] }];
    } else if (_effectedLines[0] === undefined && _effectedLines[1]) {
      _effectedLines[1].coordinate = [{ ..._effectedLines[1].coordinate[0] }, { x, y }];
    } else if (_effectedLines[0] && _effectedLines[1]) {
      // 更新下一个线段的起点
      _effectedLines[0].coordinate = [{ x, y }, { ..._effectedLines[0].coordinate[1] }];
      // 更新前一个线段的终点
      _effectedLines[1].coordinate = [{ ..._effectedLines[1].coordinate[0] }, { x, y }];
    }

    // 手动更新组合的包围盒
    this.group.update();
    this.syncCoordToData();
    eventEmitter.emit(EInternalEvent.DraftResize, e, this);
  };

  /**
   * 释放控制点
   */
  private _onControllerPointUp = () => {
    this._pointIndex = null;
  };

  // ========================== 控制边 ==========================

  private _onEdgeDown = (_e: MouseEvent, edge: ControllerEdge) => {
    const { group } = this;

    // 记录受影响的控制点
    group.each((shape) => {
      if (shape instanceof ControllerPoint) {
        if (
          (shape.dynamicCoordinate[0].x === edge.dynamicCoordinate[0].x &&
            shape.dynamicCoordinate[0].y === edge.dynamicCoordinate[0].y) ||
          (shape.dynamicCoordinate[0].x === edge.dynamicCoordinate[1].x &&
            shape.dynamicCoordinate[0].y === edge.dynamicCoordinate[1].y)
        ) {
          this._effectedControllerPoints.push(shape);
        }
      }

      if (shape instanceof ControllerEdge) {
        if (
          shape.dynamicCoordinate[0].x === edge.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[0].y === edge.dynamicCoordinate[0].y
        ) {
          this._effectedControllerEdges.push([shape, 0, 0]);
        }

        if (
          shape.dynamicCoordinate[1].x === edge.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[1].y === edge.dynamicCoordinate[0].y
        ) {
          this._effectedControllerEdges.push([shape, 0, 1]);
        }

        if (
          shape.dynamicCoordinate[0].x === edge.dynamicCoordinate[1].x &&
          shape.dynamicCoordinate[0].y === edge.dynamicCoordinate[1].y
        ) {
          this._effectedControllerEdges.push([shape, 1, 0]);
        }

        if (
          shape.dynamicCoordinate[1].x === edge.dynamicCoordinate[1].x &&
          shape.dynamicCoordinate[1].y === edge.dynamicCoordinate[1].y
        ) {
          this._effectedControllerEdges.push([shape, 1, 1]);
        }
      }
    });

    // 记录受影响的多边形坐标索引
    group.shapes[0].dynamicCoordinate.forEach((point, index) => {
      if (point.x === edge.dynamicCoordinate[0].x && point.y === edge.dynamicCoordinate[0].y) {
        this._effectedCoordinateIndexes.push([0, index]);
      }

      if (point.x === edge.dynamicCoordinate[1].x && point.y === edge.dynamicCoordinate[1].y) {
        this._effectedCoordinateIndexes.push([1, index]);
      }
    });
  };

  private _onEdgeMove = (_e: MouseEvent, edge: ControllerEdge) => {
    const { config, _effectedControllerPoints, _effectedCoordinateIndexes, _effectedControllerEdges } = this;
    const [safeX, safeY] = config.outOfImage ? [true, true] : axis!.isCoordinatesSafe(edge.previousDynamicCoordinate!);

    const x1 = axis!.getOriginalX(edge.previousDynamicCoordinate![0].x + axis!.distance.x);
    const y1 = axis!.getOriginalY(edge.previousDynamicCoordinate![0].y + axis!.distance.y);
    const x2 = axis!.getOriginalX(edge.previousDynamicCoordinate![1].x + axis!.distance.x);
    const y2 = axis!.getOriginalY(edge.previousDynamicCoordinate![1].y + axis!.distance.y);

    // 安全区域内移动
    if (!config.outOfImage) {
      if (safeX) {
        edge.coordinate[0].x = x1;
        edge.coordinate[1].x = x2;
      }

      if (safeY) {
        edge.coordinate[0].y = y1;
        edge.coordinate[1].y = y2;
      }
    }

    // 更新控制点的坐标
    if (safeX) {
      _effectedControllerPoints[0].coordinate[0].x = x1;
      _effectedControllerPoints[1].coordinate[0].x = x2;
    }
    if (safeY) {
      _effectedControllerPoints[0].coordinate[0].y = y1;
      _effectedControllerPoints[1].coordinate[0].y = y2;
    }

    // 更新多边形的坐标
    _effectedCoordinateIndexes.forEach(([edgePointIndex, coordinateIndex]) => {
      if (edgePointIndex === 0) {
        if (safeX) {
          this.group.shapes[0].coordinate[coordinateIndex].x = x1;
        }

        if (safeY) {
          this.group.shapes[0].coordinate[coordinateIndex].y = y1;
        }
      } else {
        if (safeX) {
          this.group.shapes[0].coordinate[coordinateIndex].x = x2;
        }

        if (safeY) {
          this.group.shapes[0].coordinate[coordinateIndex].y = y2;
        }
      }
    });

    // 更新受影响的线段
    _effectedControllerEdges.forEach(([edgeItem, currentEdgePointIndex, effectedPointIndex]) => {
      if (currentEdgePointIndex === 0) {
        if (safeX) {
          edgeItem.coordinate[effectedPointIndex].x = x1;
        }

        if (safeY) {
          edgeItem.coordinate[effectedPointIndex].y = y1;
        }
      } else {
        if (safeX) {
          edgeItem.coordinate[effectedPointIndex].x = x2;
        }

        if (safeY) {
          edgeItem.coordinate[effectedPointIndex].y = y2;
        }
      }
    });

    this.group.update();
    this.syncCoordToData();
    eventEmitter.emit(EInternalEvent.DraftResize, 2, this);
  };

  private _onEdgeUp = () => {
    this._effectedControllerPoints = [];
    this._effectedCoordinateIndexes = [];
    this._effectedControllerEdges = [];
  };

  protected getDynamicCoordinates() {
    return this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  protected getPolygonCoordinates() {
    return cloneDeep(this.group.shapes[0].dynamicCoordinate);
  }

  public getCenter() {
    const { group } = this;

    const maxX = Math.max(...group.shapes[0].dynamicCoordinate.map((item) => item.x));
    const maxY = Math.max(...group.shapes[0].dynamicCoordinate.map((item) => item.y));
    const minX = Math.min(...group.shapes[0].dynamicCoordinate.map((item) => item.x));
    const minY = Math.min(...group.shapes[0].dynamicCoordinate.map((item) => item.y));

    return {
      x: (maxX + minX) / 2,
      y: (maxY + minY) / 2,
    };
  }

  public destroy() {
    super.destroy();
    eventEmitter.off(EInternalEvent.KeyDown, this._onKeyDown);
    eventEmitter.off(EInternalEvent.KeyUp, this._onKeyUp);
  }

  public syncCoordToData() {
    const { group, data } = this;
    // 第一个是多边形
    const polygonCoordinate = group.shapes[0].dynamicCoordinate;

    for (let i = 0; i < polygonCoordinate.length; i++) {
      data.points[i].x = axis!.getOriginalX(polygonCoordinate[i].x);
      data.points[i].y = axis!.getOriginalY(polygonCoordinate[i].y);
    }
  }
}
