import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { PolygonData, PolygonGroup } from '../annotation';
import type { AxisPoint, PointStyle, PolygonStyle, Point } from '../shapes';
import { Polygon } from '../shapes';
import { axis, eventEmitter, monitor, rbush } from '../singletons';
import type { AnnotationParams } from '../annotation/Annotation';
import { Annotation } from '../annotation/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { DraftObserverMixin } from './DraftObserver';
import { ControllerEdge } from './ControllerEdge';
import type { PolygonTool, PolygonToolOptions } from '../tools';
import { EInternalEvent } from '../enums';
import { generatePolygonsFromDifference, getLatestPointOnLine, isBBoxIntersect } from '../shapes/math.util';
import { Tool } from '../tools/Tool';

export class DraftPolygon extends DraftObserverMixin(
  Annotation<PolygonData, Polygon | Point | Line, PolygonStyle | PointStyle | LineStyle>,
) {
  public config: PolygonToolOptions;

  private _isControllerPicked: boolean = false;

  private _pointIndex: number | null = null;

  private _previousDynamicCoordinates: AxisPoint[][] | null = null;

  private _previousPolygonCoordinates: AxisPoint[] = [];

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
    super(params);

    this.config = config;
    this._tool = tool;
    this._setupShapes();
    this.onMouseDown(this._onMouseDown);
    this.onMove(this._onMouseMove);
    this.onMouseUp(this._onMouseUp);

    eventEmitter.on(EInternalEvent.KeyDown, this._onKeyDown);
    eventEmitter.on(EInternalEvent.KeyUp, this._onKeyUp);
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style, config } = this;

    group.add(
      // 多边形用于颜色填充
      new Polygon({
        id: data.id,
        coordinate: cloneDeep(data.pointList),
        style: { ...style, strokeWidth: 0, stroke: 'transparent' },
      }),
    );

    // 多线段用于控制多边形的边
    const fullPoints = [...data.pointList, data.pointList[0]];

    for (let i = 1; i < fullPoints.length; i++) {
      const startPoint = fullPoints[i - 1];
      const endPoint = fullPoints[i];

      const edge = new ControllerEdge({
        id: uuid(),
        coordinate: cloneDeep([startPoint, endPoint]),
        style,
      });

      edge.onMouseDown(this._onEdgeDown);
      edge.onMove(this._onEdgeMove);
      edge.onMouseUp(this._onEdgeUp);

      edge.on(EInternalEvent.ShapeOver, this._onLineOver);

      group.add(edge);
    }

    // 点要覆盖在线上
    for (let i = 0; i < data.pointList.length; i++) {
      const pointItem = data.pointList[i];
      const point = new ControllerPoint({
        id: uuid(),
        outOfImage: config.outOfImage,
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
  _onKeyDown = (e: KeyboardEvent) => {
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
    const groups: PolygonGroup[] = [];
    const polygon = this.group.shapes[0] as Polygon;

    this._tool.drawing?.forEach((annotation) => {
      if (annotation.group.id !== this.group.id && isBBoxIntersect(polygon.bbox, annotation.group.bbox)) {
        groups.push(annotation.group as PolygonGroup);
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
      this.data.pointList = firstPolygon![0].map((item: number[]) => {
        return {
          id: uuid(),
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
      const newAnnotationsData = polygons.map((items) => {
        // NOTE: 生成的多边形坐标最后一个点和第一个点是重复的，需要删除
        items[0].pop();

        return {
          ...cloneDeep(this.data),
          id: uuid(),
          pointList: items[0].map((item: number[]) => {
            return {
              id: uuid(),
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
    }
  }

  private _onKeyUp = () => {
    this._removeTempPoint();
  };

  private _onLineOver = (_e: MouseEvent, line: Line) => {
    const { config, group, _pointToBeAdded } = this;

    // 只有按下 alt 键时，才能在线段上增加控制点
    if (!monitor?.keyboard.Alt) {
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
        id: uuid(),
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

  /**
   * 选中草稿
   */
  private _onMouseDown = () => {
    this._isControllerPicked = false;
    this.isPicked = true;
    this._previousDynamicCoordinates = this.getDynamicCoordinates();
    this._previousPolygonCoordinates = this.getPolygonCoordinates();
  };

  /**
   * 移动草稿
   */
  private _onMouseMove = () => {
    const { isPicked, config, _previousDynamicCoordinates, _previousPolygonCoordinates } = this;

    if (!isPicked || !_previousDynamicCoordinates) {
      return;
    }

    const [safeX, safeY] = config.outOfImage ? [true, true] : axis!.isCoordinatesSafe(_previousDynamicCoordinates);

    // 更新草稿坐标
    this.group.each((shape, shapeIndex) => {
      if (shape instanceof Line) {
        const startPoint = axis!.getOriginalCoord({
          x: _previousDynamicCoordinates[shapeIndex][0].x + axis!.distance.x,
          y: _previousDynamicCoordinates[shapeIndex][0].y + axis!.distance.y,
        });

        const endPoint = axis!.getOriginalCoord({
          x: _previousDynamicCoordinates[shapeIndex][1].x + axis!.distance.x,
          y: _previousDynamicCoordinates[shapeIndex][1].y + axis!.distance.y,
        });

        if (safeX) {
          shape.coordinate[0].x = startPoint.x;
          shape.coordinate[1].x = endPoint.x;
        }

        if (safeY) {
          shape.coordinate[0].y = startPoint.y;
          shape.coordinate[1].y = endPoint.y;
        }
      } else if (shape instanceof Polygon) {
        shape.coordinate.forEach((point, index) => {
          if (safeX) {
            point.x = axis!.getOriginalX(_previousPolygonCoordinates[index].x + axis!.distance.x);
          }

          if (safeY) {
            point.y = axis!.getOriginalY(_previousPolygonCoordinates[index].y + axis!.distance.y);
          }
        });
      } else {
        // Point
        if (safeX) {
          shape.coordinate[0].x = axis!.getOriginalX(_previousDynamicCoordinates[shapeIndex][0].x + axis!.distance.x);
        }

        if (safeY) {
          shape.coordinate[0].y = axis!.getOriginalY(_previousDynamicCoordinates[shapeIndex][0].y + axis!.distance.y);
        }
      }
    });

    // 手动更新组合的包围盒
    this.group.update();
    // 手动将坐标同步到数据
    this.syncCoordToData();
  };

  private _onMouseUp = () => {
    this.isPicked = false;
    this._previousDynamicCoordinates = null;
    this._previousPolygonCoordinates = [];
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
      const insertIndex = Number(_pointToBeAdded.name);
      // 先往data里增加一个点
      data.pointList.splice(insertIndex, 0, {
        id: _pointToBeAdded.id,
        x: _pointToBeAdded.coordinate[0].x,
        y: _pointToBeAdded.coordinate[0].y,
      });
      group.clear();
      this._setupShapes();
      this._pointToBeAdded = null;
      axis?.rerender();

      return;
    }

    // 删除端点
    if (monitor?.keyboard.Alt) {
      // 少于两个点或少于配置的最少点数时，不允许删除
      if (data.pointList.length <= config.closingPointAmount!) {
        Tool.error({
          type: 'closingPointAmount',
          message: `At least ${config.closingPointAmount} points are required`,
        });

        return;
      }
      const deleteIndex = group.shapes.indexOf(point) - data.pointList.length - 1;
      data.pointList.splice(deleteIndex, 1);
      group.clear();
      this._setupShapes();
      axis?.rerender();

      return;
    }

    this._isControllerPicked = true;
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
    const { _pointIndex, _isControllerPicked, _effectedLines } = this;

    if (!_isControllerPicked || _pointIndex === null || !_effectedLines) {
      return;
    }

    let x = coordinate[0].x;
    let y = coordinate[0].y;

    const latestPoint = rbush.scanPolygonsAndSetNearestPoint(
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
  };

  /**
   * 释放控制点
   */
  private _onControllerPointUp = () => {
    this._isControllerPicked = false;
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

  public get isControllerPicked() {
    return this._isControllerPicked;
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
      data.pointList[i].x = axis!.getOriginalX(polygonCoordinate[i].x);
      data.pointList[i].y = axis!.getOriginalY(polygonCoordinate[i].y);
    }
  }
}
