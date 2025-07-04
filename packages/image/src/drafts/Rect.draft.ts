import cloneDeep from 'lodash.clonedeep';
import type { BBox } from 'rbush';
import Color from 'color';

import uid from '@/utils/uid';
import { EInternalEvent } from '@/enums';

import { Rect, type RectStyle } from '../shapes/Rect.shape';
import { AnnotationRect, type RectData } from '../annotations';
import type { AxisPoint, LineCoordinate, PointStyle } from '../shapes';
import { Point } from '../shapes';
import { axis, eventEmitter } from '../singletons';
import type { AnnotationParams } from '../annotations/Annotation';
import { Annotation } from '../annotations/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { Draft } from './Draft';
import { ControllerEdge } from './ControllerEdge';
import type { RectToolOptions } from '../tools';

type ControllerPosition = 'nw' | 'ne' | 'se' | 'sw';

type EdgePosition = 'top' | 'right' | 'bottom' | 'left';

export class DraftRect extends Draft<RectData, RectStyle | PointStyle> {
  public config: RectToolOptions;

  private _preBBox: BBox | null = null;

  private _unscaledPreBBox: BBox | null = null;

  private _controllerPositionMapping: Map<ControllerPosition, ControllerPoint> = new Map();

  private _edgePositionMapping: Map<EdgePosition, ControllerEdge> = new Map();

  constructor(config: RectToolOptions, params: AnnotationParams<RectData, RectStyle>) {
    super({ ...params, name: 'rect', labelColor: AnnotationRect.labelStatic.getLabelColor(params.data.label) });

    this.config = config;

    this._setupShapes();
    this.onMouseUp(this._onMouseUp);
    this.finishSetup();
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style, config, labelColor, strokeColor } = this;
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
        id: uid(),
        coordinate: { ...nwCoord },
        width: data.width,
        height: data.height,
        // 只填充颜色，不描边
        style: {
          ...style,
          strokeWidth: 0,
          stroke: 'transparent',
          fill: Color(labelColor).alpha(0.5).string(),
        },
      }),
    );

    for (let i = 0; i < lineCoordinates.length; i++) {
      const edge = new ControllerEdge({
        id: uid(),
        name: lineCoordinates[i].name,
        disabled: !this.requestEdit('update'),
        coordinate: lineCoordinates[i].coordinate,
        style: {
          ...style,
          stroke: strokeColor,
          strokeWidth: Annotation.strokeWidth,
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
        id: uid(),
        name: points[i].name,
        disabled: !this.requestEdit('update'),
        outOfImage: config.outOfImage,
        coordinate: points[i],
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

  private _onMouseUp = () => {
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
    this._updateControllerAndEdgeAndPreBBox();
  };

  /**
   * 移动控制点
   * @param ControllerPoint
   * @description 控制点移动时，更新线段的端点
   */
  private _onControllerPointMove = (controllerPoint: ControllerPoint) => {
    const { _controllerPositionMapping, _edgePositionMapping, _unscaledPreBBox, group, config } = this;

    if (!_unscaledPreBBox) {
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

    const { minWidth = 1, minHeight = 1 } = config;

    let safeX = x;
    let safeY = y;

    // 更新端点坐标
    if (selectedPointName === 'nw') {
      if (x < _unscaledPreBBox.maxX) {
        safeX = Math.min(_unscaledPreBBox.maxX - minWidth, x);
      } else {
        safeX = Math.max(_unscaledPreBBox.maxX + minWidth, x);
      }

      if (y < _unscaledPreBBox.maxY) {
        safeY = Math.min(_unscaledPreBBox.maxY - minHeight, y);
      } else {
        safeY = Math.max(_unscaledPreBBox.maxY + minHeight, y);
      }

      const width = Math.abs(safeX - _unscaledPreBBox.maxX);
      const height = Math.abs(safeY - _unscaledPreBBox.maxY);

      if (width < minWidth) {
        return;
      }

      rect.width = width;
      rect.height = height;

      swPoint.coordinate[0].x = safeX;
      nePoint.coordinate[0].y = safeY;

      // 更新Top线段坐标
      topEdge.coordinate[0].x = safeX;
      topEdge.coordinate[0].y = safeY;
      topEdge.coordinate[1].x = _unscaledPreBBox.maxX;
      topEdge.coordinate[1].y = safeY;
      // 更新Left线段坐标
      leftEdge.coordinate[1].x = safeX;
      leftEdge.coordinate[1].y = safeY;
      leftEdge.coordinate[0].x = safeX;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[1].x = safeX;
      // 更新Right线段坐标
      rightEdge.coordinate[0].y = safeY;

      if (x > _unscaledPreBBox.maxX) {
        rect.coordinate[0].x = _unscaledPreBBox.maxX;
      } else {
        rect.coordinate[0].x = safeX;
      }

      if (y > _unscaledPreBBox.maxY) {
        rect.coordinate[0].y = _unscaledPreBBox.maxY;
      } else {
        rect.coordinate[0].y = safeY;
      }
    } else if (selectedPointName === 'ne') {
      if (x > _unscaledPreBBox.minX) {
        safeX = Math.max(_unscaledPreBBox.minX + minWidth, x);
      } else {
        safeX = Math.min(_unscaledPreBBox.minX - minWidth, x);
      }

      if (y < _unscaledPreBBox.maxY) {
        safeY = Math.min(_unscaledPreBBox.maxY - minHeight, y);
      } else {
        safeY = Math.max(_unscaledPreBBox.maxY + minHeight, y);
      }

      rect.width = Math.abs(safeX - _unscaledPreBBox.minX);
      rect.height = Math.abs(safeY - _unscaledPreBBox.maxY);

      sePoint.coordinate[0].x = safeX;
      nwPoint.coordinate[0].y = safeY;

      // 更新Top线段坐标
      topEdge.coordinate[1].x = safeX;
      topEdge.coordinate[1].y = safeY;
      topEdge.coordinate[0].y = safeY;
      // 更新Right线段坐标
      rightEdge.coordinate[0].x = safeX;
      rightEdge.coordinate[0].y = safeY;
      rightEdge.coordinate[1].x = safeX;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[0].x = safeX;
      // 更新Left线段坐标
      leftEdge.coordinate[1].y = safeY;

      if (x < _unscaledPreBBox.minX) {
        rect.coordinate[0].x = safeX;
      } else {
        rect.coordinate[0].x = _unscaledPreBBox.minX;
      }

      if (y > _unscaledPreBBox.maxY) {
        rect.coordinate[0].y = _unscaledPreBBox.maxY;
      } else {
        rect.coordinate[0].y = safeY;
      }
    } else if (selectedPointName === 'se') {
      if (x > _unscaledPreBBox.minX) {
        safeX = Math.max(_unscaledPreBBox.minX + minWidth, x);
      } else {
        safeX = Math.min(_unscaledPreBBox.minX - minWidth, x);
      }

      if (y > _unscaledPreBBox.minY) {
        safeY = Math.max(_unscaledPreBBox.minY + minHeight, y);
      } else {
        safeY = Math.min(_unscaledPreBBox.minY - minHeight, y);
      }

      rect.width = Math.abs(safeX - _unscaledPreBBox.minX);
      rect.height = Math.abs(safeY - _unscaledPreBBox.minY);

      nePoint.coordinate[0].x = safeX;
      swPoint.coordinate[0].y = safeY;

      // 更新Right线段坐标
      rightEdge.coordinate[1].x = safeX;
      rightEdge.coordinate[1].y = safeY;
      rightEdge.coordinate[0].x = safeX;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[0].x = safeX;
      bottomEdge.coordinate[0].y = safeY;
      bottomEdge.coordinate[1].y = safeY;
      // 更新Left线段坐标
      leftEdge.coordinate[0].y = safeY;
      // 更新Top线段坐标
      topEdge.coordinate[1].x = safeX;

      if (x < _unscaledPreBBox.minX) {
        rect.coordinate[0].x = safeX;
      } else {
        rect.coordinate[0].x = _unscaledPreBBox.minX;
      }

      if (y < _unscaledPreBBox.minY) {
        rect.coordinate[0].y = safeY;
      } else {
        rect.coordinate[0].y = _unscaledPreBBox.minY;
      }
    } else if (selectedPointName === 'sw') {
      if (x < _unscaledPreBBox.maxX) {
        safeX = Math.min(_unscaledPreBBox.maxX - minWidth, x);
      } else {
        safeX = Math.max(_unscaledPreBBox.maxX + minWidth, x);
      }

      if (y > _unscaledPreBBox.minY) {
        safeY = Math.max(_unscaledPreBBox.minY + minHeight, y);
      } else {
        safeY = Math.min(_unscaledPreBBox.minY - minHeight, y);
      }

      rect.width = Math.abs(safeX - _unscaledPreBBox.maxX);
      rect.height = Math.abs(safeY - _unscaledPreBBox.minY);

      nwPoint.coordinate[0].x = safeX;
      sePoint.coordinate[0].y = safeY;

      // 更新Left线段坐标
      leftEdge.coordinate[0].x = safeX;
      leftEdge.coordinate[0].y = safeY;
      leftEdge.coordinate[1].x = safeX;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[1].x = safeX;
      bottomEdge.coordinate[1].y = safeY;
      bottomEdge.coordinate[0].y = safeY;
      // 更新Top线段坐标
      topEdge.coordinate[0].x = safeX;
      // 更新Right线段坐标
      rightEdge.coordinate[1].y = safeY;

      if (x > _unscaledPreBBox.maxX) {
        rect.coordinate[0].x = _unscaledPreBBox.maxX;
      } else {
        rect.coordinate[0].x = safeX;
      }

      if (y < _unscaledPreBBox.minY) {
        rect.coordinate[0].y = safeY;
      } else {
        rect.coordinate[0].y = _unscaledPreBBox.minY;
      }
    }

    // 手动更新组合的包围盒
    this.group.update();
    eventEmitter.emit(EInternalEvent.DraftResize, this);
  };

  /**
   * 释放控制点
   */
  private _onControllerPointUp = () => {
    this.syncCoordToData();
  };

  // ========================== 控制边 ==========================

  private _onEdgeDown = () => {
    this._updateControllerAndEdgeAndPreBBox();
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

    const { minWidth = 1, minHeight = 1 } = config;
    const x = axis!.getOriginalX(edge.previousDynamicCoordinate![0].x + axis!.distance.x);
    const y = axis!.getOriginalY(edge.previousDynamicCoordinate![0].y + axis!.distance.y);

    let [safeX, safeY] = config.outOfImage ? [true, true] : axis!.isCoordinatesSafe(edge.previousDynamicCoordinate!);

    if (safeX && edge.name === 'left') {
      safeX = Math.abs(x - _unscaledPreBBox!.maxX) >= minWidth;
    }

    if (safeX && edge.name === 'right') {
      safeX = Math.abs(x - _unscaledPreBBox!.minX) >= minWidth;
    }

    if (safeY && edge.name === 'top') {
      safeY = Math.abs(y - _unscaledPreBBox!.maxY) >= minHeight;
    }

    if (safeY && edge.name === 'bottom') {
      safeY = Math.abs(y - _unscaledPreBBox!.minY) >= minHeight;
    }

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
    eventEmitter.emit(EInternalEvent.DraftResize, this);
  };

  private _onEdgeUp = () => {
    this._preBBox = null;
    this.syncCoordToData();
  };

  /**
   * 更新控制点和控制边及其方位信息
   */
  private _updateControllerAndEdgeAndPreBBox() {
    this._preBBox = this._getBBox();
    this._unscaledPreBBox = {
      minX: axis!.getOriginalX(this._preBBox!.minX),
      minY: axis!.getOriginalY(this._preBBox!.minY),
      maxX: axis!.getOriginalX(this._preBBox!.maxX),
      maxY: axis!.getOriginalY(this._preBBox!.maxY),
    };

    const { group, _unscaledPreBBox, _edgePositionMapping, _controllerPositionMapping } = this;
    const { minX, minY, maxX, maxY } = _unscaledPreBBox;

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

  public getCenter() {
    const { minX, minY, maxX, maxY } = this._getBBox();
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
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
