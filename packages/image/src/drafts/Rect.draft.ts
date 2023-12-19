import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';
import type { BBox } from 'rbush';

import { Rect, type RectStyle } from '../shapes/Rect.shape';
import type { RectData } from '../annotation';
import type { AxisPoint, LineCoordinate, PointStyle } from '../shapes';
import { Point } from '../shapes';
import { axis } from '../singletons';
import type { AnnotationParams } from '../annotation/Annotation';
import { Annotation } from '../annotation/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { DraftObserverMixin } from './DraftObserver';
import { ControllerEdge } from './ControllerEdge';
import type { RectToolOptions } from '../tools';

type ControllerPosition = 'nw' | 'ne' | 'se' | 'sw';

type EdgePosition = 'top' | 'right' | 'bottom' | 'left';

export class DraftRect extends DraftObserverMixin(
  Annotation<RectData, ControllerEdge | Point | Rect, RectStyle | PointStyle>,
) {
  public config: RectToolOptions;
  private _isControllerPicked: boolean = false;

  private _isEdgeControllerPicked: boolean = false;

  private _preBBox: BBox | null = null;

  private _unscaledPreBBox: BBox | null = null;

  private _previousDynamicCoordinates: AxisPoint[][] | null = null;

  private _controllerPositionMapping: Map<ControllerPosition, ControllerPoint> = new Map();

  private _edgePositionMapping: Map<EdgePosition, ControllerEdge> = new Map();

  constructor(config: RectToolOptions, params: AnnotationParams<RectData, RectStyle>) {
    super(params);

    this.config = config;

    this._setupShapes();
    this.onMouseDown(this._onMouseDown);
    this.onMove(this._onMouseMove);
    this.onMouseUp(this._onMouseUp);
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style, config } = this;
    const nwCoord = { x: data.x, y: data.y };
    const neCoord = { x: data.x + data.width, y: data.y };
    const seCoord = { x: data.x + data.width, y: data.y + data.height };
    const swCoord = { x: data.x, y: data.y + data.height };

    const lineCoordinates: {
      name: EdgePosition;
      coordinate: LineCoordinate;
    }[] = [
      // Top
      {
        name: 'top',
        coordinate: [nwCoord, neCoord],
      },
      // Right
      {
        name: 'right',
        coordinate: [neCoord, seCoord],
      },
      // Bottom
      {
        name: 'bottom',
        coordinate: [seCoord, swCoord],
      },
      // Left
      {
        name: 'left',
        coordinate: [swCoord, nwCoord],
      },
    ];

    group.add(
      new Rect({
        id: uuid(),
        coordinate: { ...nwCoord },
        width: data.width,
        height: data.height,
        // 只填充颜色，不描边
        style: { ...style, strokeWidth: 0, stroke: 'transparent' },
      }),
    );

    for (let i = 0; i < lineCoordinates.length; i++) {
      const edge = new ControllerEdge({
        id: uuid(),
        name: lineCoordinates[i].name,
        coordinate: lineCoordinates[i].coordinate,
        style: {
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
        },
      });

      this._edgePositionMapping.set(lineCoordinates[i].name as EdgePosition, edge);

      edge.onMouseDown(this._onEdgeDown);
      edge.onMove(this._onEdgeMove);
      edge.onMouseUp(this._onEdgeUp);

      group.add(edge);
    }

    const points = [
      {
        // 左上角
        name: 'nw',
        ...nwCoord,
      },
      {
        // 右上角
        name: 'ne',
        ...neCoord,
      },
      {
        // 右下角
        name: 'se',
        ...seCoord,
      },
      {
        // 左下角
        name: 'sw',
        ...swCoord,
      },
    ];

    // 点要覆盖在线上
    for (let i = 0; i < points.length; i++) {
      const point = new ControllerPoint({
        id: uuid(),
        name: points[i].name,
        outOfCanvas: config.outOfCanvas,
        coordinate: points[i],
        style: { ...style, radius: 8, stroke: 'transparent', fill: 'blue' },
      });

      this._controllerPositionMapping.set(points[i].name as ControllerPosition, point);

      point.onMouseDown(this._onControllerPointDown);
      point.onMove(this._onControllerPointMove);
      point.onMouseUp(this._onControllerPointUp);

      group.add(point);
    }
  }

  private _getBBox() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < this.group.shapes.length; i += 1) {
      const shape = this.group.shapes[i];

      if (!(shape instanceof Point)) {
        continue;
      }

      const coordinate = shape.dynamicCoordinate[0];

      minX = Math.min(minX, coordinate.x);
      minY = Math.min(minY, coordinate.y);
      maxX = Math.max(maxX, coordinate.x);
      maxY = Math.max(maxY, coordinate.y);
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
    };
  }

  // ========================== 选中的标注草稿 ==========================

  /**
   * 选中草稿
   */
  private _onMouseDown = () => {
    const { _isControllerPicked, _isEdgeControllerPicked } = this;

    // 选中控制点或控制边时，不需要选中草稿
    if (_isControllerPicked || _isEdgeControllerPicked) {
      return;
    }

    this._isControllerPicked = false;
    this.isPicked = true;
    this._previousDynamicCoordinates = this.getDynamicCoordinates();
  };

  /**
   * 移动草稿拉框
   */
  private _onMouseMove = () => {
    const { isPicked, _previousDynamicCoordinates, group, config } = this;

    if (!isPicked || !_previousDynamicCoordinates) {
      return;
    }

    const [safeX, safeY] = config.outOfCanvas ? [true, true] : axis!.isCoordinatesSafe(_previousDynamicCoordinates);
    const rect = group.shapes[0] as Rect;
    // 更新rect矩形坐标
    if (safeX) {
      rect.coordinate[0].x = axis!.getOriginalX(_previousDynamicCoordinates[0][0].x + axis!.distance.x);
    }

    if (safeY) {
      rect.coordinate[0].y = axis!.getOriginalY(_previousDynamicCoordinates[0][0].y + axis!.distance.y);
    }

    // 更新草稿坐标
    group.each((shape, index) => {
      const x1 = axis!.getOriginalX(_previousDynamicCoordinates[index][0].x + axis!.distance.x);
      const y1 = axis!.getOriginalY(_previousDynamicCoordinates[index][0].y + axis!.distance.y);

      if (shape instanceof ControllerPoint) {
        if (safeX) {
          shape.coordinate[0].x = x1;
        }

        if (safeY) {
          shape.coordinate[0].y = y1;
        }
      } else if (shape instanceof ControllerEdge) {
        const x2 = axis!.getOriginalX(_previousDynamicCoordinates[index][1].x + axis!.distance.x);
        const y2 = axis!.getOriginalY(_previousDynamicCoordinates[index][1].y + axis!.distance.y);

        if (safeX) {
          shape.coordinate[0].x = x1;
          shape.coordinate[1].x = x2;
        }

        if (safeY) {
          shape.coordinate[0].y = y1;
          shape.coordinate[1].y = y2;
        }
      }
    });

    // 手动更新组合的包围盒
    this.group.update();
  };

  private _onMouseUp = () => {
    this.isPicked = false;
    this._previousDynamicCoordinates = null;
    // 手动将坐标同步到数据
    this.syncCoordToData();
  };

  // ========================== 控制点 ==========================
  /**
   * 按下控制点
   * @param point
   * @description 按下控制点时，记录受影响的线段
   */
  private _onControllerPointDown = () => {
    this._isControllerPicked = true;
    this._updateControllerAndEdge();
  };

  /**
   * 移动控制点
   * @param ControllerPoint
   * @description 控制点移动时，更新线段的端点
   */
  private _onControllerPointMove = (controllerPoint: ControllerPoint) => {
    const { _controllerPositionMapping, _edgePositionMapping, _preBBox, _unscaledPreBBox, group } = this;

    if (!_preBBox || !_unscaledPreBBox) {
      return;
    }

    const { name: selectedPointName } = controllerPoint;
    const nwPoint = _controllerPositionMapping.get('nw')!;
    const nePoint = _controllerPositionMapping.get('ne')!;
    const sePoint = _controllerPositionMapping.get('se')!;
    const swPoint = _controllerPositionMapping.get('sw')!;

    const topEdge = _edgePositionMapping.get('top')!;
    const rightEdge = _edgePositionMapping.get('right')!;
    const bottomEdge = _edgePositionMapping.get('bottom')!;
    const leftEdge = _edgePositionMapping.get('left')!;

    const rect = group.shapes[0] as Rect;
    const { x, y } = controllerPoint.coordinate[0];

    // 更新端点坐标
    if (selectedPointName === 'nw') {
      swPoint.coordinate[0].x = x;
      nePoint.coordinate[0].y = y;

      // 更新Top线段坐标
      topEdge.coordinate[0].x = x;
      topEdge.coordinate[0].y = y;
      topEdge.coordinate[1].x = _preBBox.maxX;
      topEdge.coordinate[1].y = y;
      // 更新Left线段坐标
      leftEdge.coordinate[1].x = x;
      leftEdge.coordinate[1].y = y;
      leftEdge.coordinate[0].x = x;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[1].x = x;
      // 更新Right线段坐标
      rightEdge.coordinate[0].y = y;

      rect.width = Math.abs(x - _unscaledPreBBox.maxX);
      rect.height = Math.abs(y - _unscaledPreBBox.maxY);

      if (x > _unscaledPreBBox.maxX) {
        rect.coordinate[0].x = _unscaledPreBBox.maxX;
      } else {
        rect.coordinate[0].x = x;
      }

      if (y > _unscaledPreBBox.maxY) {
        rect.coordinate[0].y = _unscaledPreBBox.maxY;
      } else {
        rect.coordinate[0].y = y;
      }
    } else if (selectedPointName === 'ne') {
      sePoint.coordinate[0].x = x;
      nwPoint.coordinate[0].y = y;

      // 更新Top线段坐标
      topEdge.coordinate[1].x = x;
      topEdge.coordinate[1].y = y;
      topEdge.coordinate[0].y = y;
      // 更新Right线段坐标
      rightEdge.coordinate[0].x = x;
      rightEdge.coordinate[0].y = y;
      rightEdge.coordinate[1].x = x;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[0].x = x;
      // 更新Left线段坐标
      leftEdge.coordinate[1].y = y;

      rect.width = Math.abs(x - _unscaledPreBBox.minX);
      rect.height = Math.abs(y - _unscaledPreBBox.maxY);

      if (x < _unscaledPreBBox.minX) {
        rect.coordinate[0].x = x;
      } else {
        rect.coordinate[0].x = _unscaledPreBBox.minX;
      }

      if (y > _unscaledPreBBox.maxY) {
        rect.coordinate[0].y = _unscaledPreBBox.maxY;
      } else {
        rect.coordinate[0].y = y;
      }
    } else if (selectedPointName === 'se') {
      nePoint.coordinate[0].x = x;
      swPoint.coordinate[0].y = y;

      // 更新Right线段坐标
      rightEdge.coordinate[1].x = x;
      rightEdge.coordinate[1].y = y;
      rightEdge.coordinate[0].x = x;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[0].x = x;
      bottomEdge.coordinate[0].y = y;
      bottomEdge.coordinate[1].y = y;
      // 更新Left线段坐标
      leftEdge.coordinate[0].y = y;
      // 更新Top线段坐标
      topEdge.coordinate[1].x = x;

      rect.width = Math.abs(x - _unscaledPreBBox.minX);
      rect.height = Math.abs(y - _unscaledPreBBox.minY);

      if (x < _unscaledPreBBox.minX) {
        rect.coordinate[0].x = x;
      } else {
        rect.coordinate[0].x = _unscaledPreBBox.minX;
      }

      if (y < _unscaledPreBBox.minY) {
        rect.coordinate[0].y = y;
      } else {
        rect.coordinate[0].y = _unscaledPreBBox.minY;
      }
    } else if (selectedPointName === 'sw') {
      nwPoint.coordinate[0].x = x;
      sePoint.coordinate[0].y = y;

      // 更新Left线段坐标
      leftEdge.coordinate[0].x = x;
      leftEdge.coordinate[0].y = y;
      leftEdge.coordinate[1].x = x;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[1].x = x;
      bottomEdge.coordinate[1].y = y;
      bottomEdge.coordinate[0].y = y;
      // 更新Top线段坐标
      topEdge.coordinate[0].x = x;
      // 更新Right线段坐标
      rightEdge.coordinate[1].y = y;

      rect.width = Math.abs(x - _unscaledPreBBox.maxX);
      rect.height = Math.abs(y - _unscaledPreBBox.minY);

      if (x > _unscaledPreBBox.maxX) {
        rect.coordinate[0].x = _unscaledPreBBox.maxX;
      } else {
        rect.coordinate[0].x = x;
      }

      if (y < _unscaledPreBBox.minY) {
        rect.coordinate[0].y = y;
      } else {
        rect.coordinate[0].y = _unscaledPreBBox.minY;
      }
    }

    // 手动更新组合的包围盒
    this.group.update();
  };

  /**
   * 释放控制点
   */
  private _onControllerPointUp = () => {
    this._isControllerPicked = false;
    this.syncCoordToData();
  };

  // ========================== 控制边 ==========================

  private _onEdgeDown = () => {
    this._isEdgeControllerPicked = true;
    this._updateControllerAndEdge();
  };

  /**
   * 控制边的移动
   */
  private _onEdgeMove = (_e: MouseEvent, edge: ControllerEdge) => {
    const { config, _controllerPositionMapping, _edgePositionMapping, _unscaledPreBBox } = this;

    const nwPoint = _controllerPositionMapping.get('nw')!;
    const nePoint = _controllerPositionMapping.get('ne')!;
    const sePoint = _controllerPositionMapping.get('se')!;
    const swPoint = _controllerPositionMapping.get('sw')!;
    const topEdge = _edgePositionMapping.get('top')!;
    const rightEdge = _edgePositionMapping.get('right')!;
    const bottomEdge = _edgePositionMapping.get('bottom')!;
    const leftEdge = _edgePositionMapping.get('left')!;
    const rect = this.group.shapes[0] as Rect;

    const x = axis!.getOriginalX(edge.previousDynamicCoordinate![0].x + axis!.distance.x);
    const y = axis!.getOriginalY(edge.previousDynamicCoordinate![0].y + axis!.distance.y);

    const [safeX, safeY] = config.outOfCanvas ? [true, true] : axis!.isCoordinatesSafe(edge.previousDynamicCoordinate!);

    if (safeX && (edge.name === 'left' || edge.name === 'right')) {
      edge.coordinate[0].x = x;
      edge.coordinate[1].x = x;
      if (edge.name === 'left') {
        rect.coordinate[0].x = Math.min(x, _unscaledPreBBox!.maxX);
        rect.width = Math.abs(x - _unscaledPreBBox!.maxX);
      } else {
        rect.coordinate[0].x = Math.min(x, _unscaledPreBBox!.minX);
        rect.width = Math.abs(x - _unscaledPreBBox!.minX);
      }
    }

    if (safeX && edge.name === 'left') {
      nwPoint.coordinate[0].x = x;
      swPoint.coordinate[0].x = x;
      topEdge.coordinate[0].x = x;
      bottomEdge.coordinate[1].x = x;
    }

    if (safeX && edge.name === 'right') {
      nePoint.coordinate[0].x = x;
      sePoint.coordinate[0].x = x;
      topEdge.coordinate[1].x = x;
      bottomEdge.coordinate[0].x = x;
    }

    if (safeY && (edge.name === 'top' || edge.name === 'bottom')) {
      edge.coordinate[0].y = y;
      edge.coordinate[1].y = y;

      if (edge.name === 'top') {
        rect.coordinate[0].y = Math.min(y, _unscaledPreBBox!.maxY);
        rect.height = Math.abs(y - _unscaledPreBBox!.maxY);
      } else {
        rect.coordinate[0].y = Math.min(y, _unscaledPreBBox!.minY);
        rect.height = Math.abs(y - _unscaledPreBBox!.minY);
      }
    }

    if (safeY && edge.name === 'top') {
      nwPoint.coordinate[0].y = y;
      nePoint.coordinate[0].y = y;
      leftEdge.coordinate[1].y = y;
      rightEdge.coordinate[0].y = y;
    }

    if (safeY && edge.name === 'bottom') {
      swPoint.coordinate[0].y = y;
      sePoint.coordinate[0].y = y;
      leftEdge.coordinate[0].y = y;
      rightEdge.coordinate[1].y = y;
    }

    this.group.update();
  };

  private _onEdgeUp = () => {
    this._isEdgeControllerPicked = false;
    this._preBBox = null;
    this.syncCoordToData();
  };

  /**
   * 更新控制点和控制边及其方位信息
   */
  private _updateControllerAndEdge() {
    this._preBBox = this._getBBox();
    this._unscaledPreBBox = {
      minX: axis!.getOriginalX(this._preBBox!.minX),
      minY: axis!.getOriginalY(this._preBBox!.minY),
      maxX: axis!.getOriginalX(this._preBBox!.maxX),
      maxY: axis!.getOriginalY(this._preBBox!.maxY),
    };

    const { group, _preBBox, _edgePositionMapping, _controllerPositionMapping } = this;
    const { minX, minY, maxX, maxY } = _preBBox;

    group.each((shape) => {
      if (shape instanceof ControllerPoint) {
        const [point] = shape.plainCoordinate;

        if (point.x === minX && point.y === minY) {
          shape.name = 'nw';
          _controllerPositionMapping.set('nw', shape);
        }

        if (point.x === maxX && point.y === minY) {
          shape.name = 'ne';
          _controllerPositionMapping.set('ne', shape);
        }

        if (point.x === maxX && point.y === maxY) {
          shape.name = 'se';
          _controllerPositionMapping.set('se', shape);
        }

        if (point.x === minX && point.y === maxY) {
          shape.name = 'sw';
          _controllerPositionMapping.set('sw', shape);
        }
      }

      if (shape instanceof ControllerEdge) {
        const [start, end] = shape.plainCoordinate;

        if (
          (start.x === minX && start.y === minY && end.x === maxX && end.y === minY) ||
          (start.x === maxX && start.y === minY && end.x === minX && end.y === minY)
        ) {
          shape.name = 'top';
          _edgePositionMapping.set('top', shape);
          shape.coordinate = [
            {
              x: minX,
              y: minY,
            },
            {
              x: maxX,
              y: minY,
            },
          ];
        }

        if (
          (start.x === maxX && start.y === minY && end.x === maxX && end.y === maxY) ||
          (start.x === maxX && start.y === maxY && end.x === maxX && end.y === minY)
        ) {
          shape.name = 'right';
          _edgePositionMapping.set('right', shape);
          shape.coordinate = [
            {
              x: maxX,
              y: minY,
            },
            {
              x: maxX,
              y: maxY,
            },
          ];
        }

        if (
          (start.x === maxX && start.y === maxY && end.x === minX && end.y === maxY) ||
          (start.x === minX && start.y === maxY && end.x === maxX && end.y === maxY)
        ) {
          shape.name = 'bottom';
          _edgePositionMapping.set('bottom', shape);
          shape.coordinate = [
            {
              x: maxX,
              y: maxY,
            },
            {
              x: minX,
              y: maxY,
            },
          ];
        }

        if (
          (start.x === minX && start.y === maxY && end.x === minX && end.y === minY) ||
          (start.x === minX && start.y === minY && end.x === minX && end.y === maxY)
        ) {
          shape.name = 'left';
          _edgePositionMapping.set('left', shape);
          shape.coordinate = [
            {
              x: minX,
              y: maxY,
            },
            {
              x: minX,
              y: minY,
            },
          ];
        }
      }
    });
  }

  protected getDynamicCoordinates() {
    return this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  public get isControllerPicked() {
    return this._isControllerPicked;
  }

  public syncCoordToData() {
    const { data } = this;

    const bbox = this._getBBox();

    data.x = axis!.getOriginalX(bbox.minX);
    data.y = axis!.getOriginalY(bbox.minY);
    data.width = axis!.getOriginalX(bbox.maxX) - data.x;
    data.height = axis!.getOriginalY(bbox.maxY) - data.y;
  }

  public isRectAndControllersUnderCursor(mouseCoord: AxisPoint) {
    const { group } = this;

    if (this.isUnderCursor(mouseCoord)) {
      return true;
    }

    for (let i = 0; i < group.shapes.length; i++) {
      const shape = group.shapes[i];

      if (shape instanceof ControllerPoint || shape instanceof ControllerEdge) {
        if (shape.isUnderCursor(mouseCoord)) {
          return true;
        }
      }
    }

    return false;
  }
}
