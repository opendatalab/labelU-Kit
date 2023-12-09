import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { PolygonData } from '../annotation';
import type { AxisPoint, PointStyle, PolygonStyle, Rect, Point } from '../shapes';
import { Polygon } from '../shapes';
import { axis } from '../singletons';
import type { AnnotationParams } from '../annotation/Annotation';
import { Annotation } from '../annotation/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { DraftObserverMixin } from './DraftObserver';
export class DraftPolygon extends DraftObserverMixin(
  Annotation<PolygonData, Polygon | Point | Line, PolygonStyle | PointStyle | LineStyle>,
) {
  private _selectionShape: Rect | null = null;

  private _isControllerPicked: boolean = false;

  private _pointIndex: number | null = null;

  private _previousDynamicCoordinates: AxisPoint[][] | null = null;

  private _previousPolygonCoordinates: AxisPoint[] = [];

  private _effectedLines: [Line | undefined, Line | undefined] | null = null;

  constructor(params: AnnotationParams<PolygonData, PolygonStyle>) {
    super(params);

    this._setupShapes();
    this.onMouseDown(this._onMouseDown);
    this.onMove(this._onMouseMove);
    this.onMouseUp(this._onMouseUp);
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style } = this;

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

      const line = new Line({
        id: uuid(),
        coordinate: cloneDeep([startPoint, endPoint]),
        style,
      });

      group.add(line);
    }

    // 点要覆盖在线上
    for (let i = 0; i < data.pointList.length; i++) {
      const pointItem = data.pointList[i];
      const point = new ControllerPoint({
        id: uuid(),
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
   * 选中草稿
   */
  private _onMouseDown = () => {
    const { _isControllerPicked } = this;

    // 选中控制点时，不需要选中草稿
    if (_isControllerPicked) {
      return;
    }

    this._isControllerPicked = false;
    this.isPicked = true;
    this._previousDynamicCoordinates = this.getDynamicCoordinates();
    this._previousPolygonCoordinates = this.getPolygonCoordinates();
  };

  /**
   * 移动草稿
   */
  private _onMouseMove = () => {
    const { isPicked, _previousDynamicCoordinates, _previousPolygonCoordinates } = this;

    if (!isPicked || !_previousDynamicCoordinates) {
      return;
    }

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
        shape.coordinate = [startPoint, endPoint];
      } else if (shape instanceof Polygon) {
        shape.coordinate.forEach((point, index) => {
          point.x = axis!.getOriginalX(_previousPolygonCoordinates[index].x + axis!.distance.x);
          point.y = axis!.getOriginalY(_previousPolygonCoordinates[index].y + axis!.distance.y);
        });
      } else {
        // Point
        shape.coordinate[0].x = axis!.getOriginalX(_previousDynamicCoordinates[shapeIndex][0].x + axis!.distance.x);
        shape.coordinate[0].y = axis!.getOriginalY(_previousDynamicCoordinates[shapeIndex][0].y + axis!.distance.y);
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
  private _onControllerPointMove = ({ coordinate }: ControllerPoint) => {
    const { _pointIndex, _isControllerPicked, _effectedLines } = this;

    if (!_isControllerPicked || _pointIndex === null || !_effectedLines) {
      return;
    }

    this.group.shapes[0].coordinate[_pointIndex].x = coordinate[0].x;
    this.group.shapes[0].coordinate[_pointIndex].y = coordinate[0].y;

    // 更新受影响的线段端点
    if (_effectedLines[1] === undefined && _effectedLines[0]) {
      _effectedLines[0].coordinate = [{ ...coordinate[0] }, { ..._effectedLines[0].coordinate[1] }];
    } else if (_effectedLines[0] === undefined && _effectedLines[1]) {
      _effectedLines[1].coordinate = [{ ..._effectedLines[1].coordinate[0] }, { ...coordinate[0] }];
    } else if (_effectedLines[0] && _effectedLines[1]) {
      // 更新下一个线段的起点
      _effectedLines[0].coordinate = [{ ...coordinate[0] }, { ..._effectedLines[0].coordinate[1] }];
      // 更新前一个线段的终点
      _effectedLines[1].coordinate = [{ ..._effectedLines[1].coordinate[0] }, { ...coordinate[0] }];
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
  };

  private _destroySelection() {
    if (this._selectionShape) {
      this._selectionShape.destroy();
      this._selectionShape = null;
    }
  }

  protected getDynamicCoordinates() {
    return this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  protected getPolygonCoordinates() {
    return cloneDeep(this.group.shapes[0].dynamicCoordinate);
  }

  public get isControllerPicked() {
    return this._isControllerPicked;
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
