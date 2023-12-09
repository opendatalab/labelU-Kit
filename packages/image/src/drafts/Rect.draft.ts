import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';
import type { BBox } from 'rbush';

import type { RectStyle } from '../shapes/Rect.shape';
import type { RectData } from '../annotation';
import type { AxisPoint, PointStyle } from '../shapes';
import { Rect, Point } from '../shapes';
import { axis } from '../singletons';
import type { AnnotationParams } from '../annotation/Annotation';
import { Annotation } from '../annotation/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { DraftObserverMixin } from './DraftObserver';

type ControllerPosition = 'nw' | 'ne' | 'se' | 'sw';

export class DraftRect extends DraftObserverMixin(Annotation<RectData, Rect | Point, RectStyle | PointStyle>) {
  private _isControllerPicked: boolean = false;

  private _preBBox: BBox | null = null;

  private _previousDynamicCoordinates: AxisPoint[][] | null = null;

  public pointPositionMapping: Map<ControllerPosition, Point> = new Map();

  private _positionSwitchingMap: Record<ControllerPosition, ControllerPosition> = {} as Record<
    ControllerPosition,
    ControllerPosition
  >;

  constructor(params: AnnotationParams<RectData, RectStyle>) {
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
      new Rect({
        id: data.id,
        coordinate: {
          x: data.x,
          y: data.y,
        },
        width: data.width,
        height: data.height,
        style,
      }),
    );

    const points = [
      {
        // 左上角
        name: 'nw',
        x: data.x,
        y: data.y,
      },
      {
        // 右上角
        name: 'ne',
        x: data.x + data.width,
        y: data.y,
      },
      {
        // 右下角
        name: 'se',
        x: data.x + data.width,
        y: data.y + data.height,
      },
      {
        // 左下角
        name: 'sw',
        x: data.x,
        y: data.y + data.height,
      },
    ];

    // 点要覆盖在线上
    for (let i = 0; i < points.length; i++) {
      const point = new ControllerPoint({
        id: uuid(),
        name: points[i].name,
        coordinate: points[i],
        style: { ...style, radius: 8, stroke: 'transparent', fill: 'blue' },
      });

      this.pointPositionMapping.set(points[i].name as ControllerPosition, point);

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
  };

  /**
   * 移动草稿
   */
  private _onMouseMove = () => {
    const { isPicked, _previousDynamicCoordinates, group } = this;

    if (!isPicked || !_previousDynamicCoordinates) {
      return;
    }

    // 更新草稿坐标
    group.each((shape, index) => {
      shape.coordinate = [
        axis!.getOriginalCoord({
          x: _previousDynamicCoordinates[index][0].x + axis!.distance.x,
          y: _previousDynamicCoordinates[index][0].y + axis!.distance.y,
        }),
      ];
    });

    // 手动更新组合的包围盒
    this.group.update();
    // 手动将坐标同步到数据
    this.syncCoordToData();
  };

  private _onMouseUp = () => {
    this.isPicked = false;
    this._previousDynamicCoordinates = null;
  };

  /**
   * 按下控制点
   * @param point
   * @description 按下控制点时，记录受影响的线段
   */
  private _onControllerPointDown = () => {
    this._isControllerPicked = true;
    this._preBBox = this.getBBoxWithoutControllerPoint();
  };

  /**
   * 移动控制点
   * @param ControllerPoint
   * @description 控制点移动时，更新线段的端点
   */
  private _onControllerPointMove = (controllerPoint: ControllerPoint) => {
    const { pointPositionMapping, group, _preBBox } = this;

    if (!_preBBox) {
      return;
    }

    const { name: selectedPointName } = controllerPoint;
    const { x, y } = controllerPoint.dynamicCoordinate[0];
    const nwPoint = pointPositionMapping.get('nw')!;
    const nePoint = pointPositionMapping.get('ne')!;
    const sePoint = pointPositionMapping.get('se')!;
    const swPoint = pointPositionMapping.get('sw')!;

    // 更新端点坐标
    if (selectedPointName === 'nw') {
      swPoint.coordinate[0].x = controllerPoint.coordinate[0].x;
      nePoint.coordinate[0].y = controllerPoint.coordinate[0].y;
    } else if (selectedPointName === 'ne') {
      sePoint.coordinate[0].x = controllerPoint.coordinate[0].x;
      nwPoint.coordinate[0].y = controllerPoint.coordinate[0].y;
    } else if (selectedPointName === 'se') {
      nePoint.coordinate[0].x = controllerPoint.coordinate[0].x;
      swPoint.coordinate[0].y = controllerPoint.coordinate[0].y;
    } else if (selectedPointName === 'sw') {
      nwPoint.coordinate[0].x = controllerPoint.coordinate[0].x;
      sePoint.coordinate[0].y = controllerPoint.coordinate[0].y;
    }

    const switchingMap: Record<ControllerPosition, ControllerPosition> = {} as Record<
      ControllerPosition,
      ControllerPosition
    >;

    // 更新矩形的坐标
    group.each((shape) => {
      if (shape instanceof Rect) {
        if (selectedPointName === 'nw') {
          if (x < _preBBox.maxX) {
            shape.coordinate[0].x = axis!.getOriginalX(x);
            shape.width = (_preBBox.maxX - x) / axis!.scale;
          }

          if (x >= _preBBox.maxX) {
            shape.coordinate[0].x = axis!.getOriginalX(_preBBox.maxX);
            shape.width = (x - _preBBox.maxX) / axis!.scale;
            switchingMap.nw = 'ne';
            switchingMap.sw = 'se';
            switchingMap.ne = 'nw';
            switchingMap.se = 'sw';
          }

          if (y < _preBBox.maxY) {
            shape.coordinate[0].y = axis!.getOriginalY(y);
            shape.height = (_preBBox.maxY - y) / axis!.scale;
          }

          if (y >= _preBBox.maxY) {
            shape.coordinate[0].y = axis!.getOriginalY(_preBBox.maxY);
            shape.height = (y - _preBBox.maxY) / axis!.scale;
            switchingMap.nw = 'sw';
            switchingMap.ne = 'se';
            switchingMap.sw = 'nw';
            switchingMap.se = 'ne';
          }

          if (x >= _preBBox.maxX && y >= _preBBox.maxY) {
            switchingMap.nw = 'se';
            switchingMap.ne = 'sw';
            switchingMap.sw = 'ne';
            switchingMap.se = 'nw';
          }
        } else if (selectedPointName === 'ne') {
          if (x > _preBBox.minX) {
            shape.coordinate[0].x = axis!.getOriginalX(_preBBox.minX);
            shape.width = (x - _preBBox.minX) / axis!.scale;
          }

          if (x <= _preBBox.minX) {
            shape.coordinate[0].x = axis!.getOriginalX(x);
            shape.width = (_preBBox.minX - x) / axis!.scale;
            switchingMap.ne = 'nw';
            switchingMap.se = 'sw';
            switchingMap.nw = 'ne';
            switchingMap.sw = 'se';
          }

          if (y < _preBBox.maxY) {
            shape.coordinate[0].y = axis!.getOriginalY(y);
            shape.height = (_preBBox.maxY - y) / axis!.scale;
          }

          if (y >= _preBBox.maxY) {
            shape.coordinate[0].y = axis!.getOriginalY(_preBBox.maxY);
            shape.height = (y - _preBBox.maxY) / axis!.scale;
            switchingMap.ne = 'se';
            switchingMap.nw = 'sw';
            switchingMap.se = 'ne';
            switchingMap.sw = 'nw';
          }

          if (x <= _preBBox.minX && y >= _preBBox.maxY) {
            switchingMap.ne = 'sw';
            switchingMap.nw = 'se';
            switchingMap.se = 'nw';
            switchingMap.sw = 'ne';
          }
        } else if (selectedPointName === 'se') {
          if (x > _preBBox.minX) {
            shape.width = (x - _preBBox.minX) / axis!.scale;
            shape.coordinate[0].x = axis!.getOriginalX(_preBBox.minX);
          }

          if (x <= _preBBox.minX) {
            shape.width = (_preBBox.minX - x) / axis!.scale;
            shape.coordinate[0].x = axis!.getOriginalX(x);
            switchingMap.se = 'sw';
            switchingMap.ne = 'nw';
            switchingMap.sw = 'se';
            switchingMap.nw = 'ne';
          }

          if (y > _preBBox.minY) {
            shape.height = (y - _preBBox.minY) / axis!.scale;
            shape.coordinate[0].y = axis!.getOriginalY(_preBBox.minY);
          }

          if (y <= _preBBox.minY) {
            shape.height = (_preBBox.minY - y) / axis!.scale;
            shape.coordinate[0].y = axis!.getOriginalY(y);
            switchingMap.se = 'ne';
            switchingMap.sw = 'nw';
            switchingMap.ne = 'se';
            switchingMap.nw = 'sw';
          }

          if (x <= _preBBox.minX && y <= _preBBox.minY) {
            switchingMap.se = 'nw';
            switchingMap.sw = 'ne';
            switchingMap.ne = 'sw';
            switchingMap.nw = 'se';
          }
        } else if (selectedPointName === 'sw') {
          if (x < _preBBox.maxX) {
            shape.coordinate[0].x = axis!.getOriginalX(x);
            shape.width = (_preBBox.maxX - x) / axis!.scale;
          }

          if (x >= _preBBox.maxX) {
            shape.coordinate[0].x = axis!.getOriginalX(_preBBox.maxX);
            shape.width = (x - _preBBox.maxX) / axis!.scale;
            switchingMap.sw = 'se';
            switchingMap.nw = 'ne';
            switchingMap.se = 'sw';
            switchingMap.ne = 'nw';
          }

          if (y > _preBBox.minY) {
            shape.coordinate[0].y = axis!.getOriginalY(_preBBox.minY);
            shape.height = (y - _preBBox.minY) / axis!.scale;
          }

          if (y <= _preBBox.minY) {
            shape.coordinate[0].y = axis!.getOriginalY(y);
            shape.height = (_preBBox.minY - y) / axis!.scale;
            switchingMap.sw = 'nw';
            switchingMap.se = 'ne';
            switchingMap.nw = 'sw';
            switchingMap.ne = 'se';
          }

          if (x >= _preBBox.maxX && y <= _preBBox.minY) {
            switchingMap.sw = 'ne';
            switchingMap.se = 'nw';
            switchingMap.nw = 'se';
            switchingMap.ne = 'sw';
          }
        }
      }
    });

    this._positionSwitchingMap = switchingMap;

    // 手动更新组合的包围盒
    this.group.update();

    this.syncCoordToData();
  };

  /**
   * 释放控制点
   */
  private _onControllerPointUp = () => {
    const { _positionSwitchingMap } = this;

    this._preBBox = this.getBBoxWithoutControllerPoint();
    this._isControllerPicked = false;

    // 拖动点松开鼠标后，重新建立草稿，更新点的方位
    this.group.each((shape) => {
      if (shape instanceof Point && shape.name && shape.name in _positionSwitchingMap) {
        shape.name = _positionSwitchingMap[shape.name as ControllerPosition] as ControllerPosition;
        this.pointPositionMapping.set(shape.name as ControllerPosition, shape);
      }
    });

    this._positionSwitchingMap = {} as Record<ControllerPosition, ControllerPosition>;
  };

  protected getDynamicCoordinates() {
    return this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  public get isControllerPicked() {
    return this._isControllerPicked;
  }

  public syncCoordToData() {
    const { data } = this;

    const bbox = this.getBBoxWithoutControllerPoint();

    data.x = axis!.getOriginalX(bbox.minX);
    data.y = axis!.getOriginalY(bbox.minY);
    data.width = axis!.getOriginalX(bbox.maxX) - data.x;
    data.height = axis!.getOriginalY(bbox.maxY) - data.y;
  }
}
