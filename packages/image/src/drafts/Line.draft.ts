import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';
import Color from 'color';

import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import { AnnotationLine, type LineData } from '../annotations';
import type { PointStyle, Point } from '../shapes';
import { Rect } from '../shapes';
import { axis, eventEmitter, monitor, rbush } from '../singletons';
import type { AnnotationParams } from '../annotations/Annotation';
import { Annotation } from '../annotations/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { Draft } from './Draft';
import type { LineToolOptions } from '../tools';
import { EInternalEvent } from '../enums';
import { getLatestPointOnLine } from '../shapes/math.util';
import { Tool } from '../tools/Tool';

export class DraftLine extends Draft<LineData, Line | Point, LineStyle | PointStyle> {
  public config: LineToolOptions;

  private _selectionShape: Rect | null = null;

  private _effectedLines: [Line | undefined, Line | undefined] | null = null;

  private _pointToBeAdded: ControllerPoint | null = null;

  constructor(config: LineToolOptions, params: AnnotationParams<LineData, LineStyle>) {
    super({ ...params, name: 'line' });

    this.config = config;
    this.labelColor = AnnotationLine.labelStatic.getLabelColor(this.data.label);
    this.strokeColor = Color(this.labelColor).alpha(Annotation.strokeOpacity).string();

    this._setupShapes();
    this.onMove(this._onMouseMove);
    this.onMouseUp(this._onMouseUp);
    this._createSelection();

    eventEmitter.on(EInternalEvent.KeyUp, this._onKeyUp);
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style, config, strokeColor } = this;

    for (let i = 1; i < data.points.length; i++) {
      const startPoint = data.points[i - 1];
      const endPoint = data.points[i];

      const line = new Line({
        id: uuid(),
        coordinate: [{ ...startPoint }, { ...endPoint }],
        style: {
          ...style,
          stroke: strokeColor,
          strokeWidth: Annotation.strokeWidth,
        },
      });

      line.on(EInternalEvent.ShapeOver, this._onLineOver);
      line.on(EInternalEvent.ShapeOut, this._onLineOut);

      group.add(line);
    }

    // 点要覆盖在线上
    for (let i = 0; i < data.points.length; i++) {
      const pointItem = data.points[i];
      const point = new ControllerPoint({
        id: pointItem.id,
        outOfImage: config.outOfImage,
        // 深拷贝，避免出现引用问题
        coordinate: { ...pointItem },
      });

      point.onMouseDown(this._onControllerPointDown);
      point.onMove(this._onControllerPointMove);
      point.onMouseUp(this._onControllerPointUp);

      group.add(point);
    }
  }

  private _onKeyUp = () => {
    this._removeTempPoint();
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

  private _onLineOver = (_e: MouseEvent, line: Line) => {
    const { config, group, _pointToBeAdded } = this;

    // 只有按下 alt 键时，才能在线段上增加控制点
    if (!monitor?.keyboard.Alt) {
      return;
    }

    line.updateStyle({
      strokeWidth: Annotation.strokeWidth + 2,
    });

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

  private _onLineOut = (_e: MouseEvent, line: Line) => {
    const { style, strokeColor } = this;

    line.updateStyle({ ...style, stroke: strokeColor, strokeWidth: Annotation.strokeWidth });
  };

  /**
   * 移动草稿
   */
  private _onMouseMove = () => {
    this._destroySelection();
  };

  private _onMouseUp = () => {
    this._createSelection();
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
      const insertIndex = Number(_pointToBeAdded.name);
      // 先往data里增加一个点
      data.points.splice(insertIndex + 1, 0, {
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
      if (data.points.length <= 2 || data.points.length <= config.minPointAmount!) {
        Tool.error({
          type: 'minPointAmount',
          message: `At least ${config.minPointAmount} points are required`,
          value: config.minPointAmount,
        });

        return;
      }
      const deleteIndex = group.shapes.indexOf(point) - data.points.length + 1;
      data.points.splice(deleteIndex, 1);
      group.clear();
      this._setupShapes();
      this._destroySelection();
      this._createSelection();
      axis?.rerender();

      eventEmitter.emit('change');

      return;
    }

    this._effectedLines = [undefined, undefined];

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
    const { _effectedLines, config } = this;
    let x = coordinate[0].x;
    let y = coordinate[0].y;

    if (!_effectedLines) {
      return;
    }

    const latestPoint =
      config.edgeAdsorptive &&
      rbush.scanLinesAndSetNearestPoint(
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

    this._destroySelection();

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
    this._createSelection();
  };

  /**
   * 创建选取框
   */
  private _createSelection() {
    if (this._selectionShape) {
      this._selectionShape.destroy();
    }

    const bbox = this.getBBoxWithoutControllerPoint();

    this._selectionShape = new Rect({
      id: uuid(),
      coordinate: axis!.getOriginalCoord({
        x: bbox.minX,
        y: bbox.minY,
      }),
      width: (bbox.maxX - bbox.minX) / axis!.scale,
      height: (bbox.maxY - bbox.minY) / axis!.scale,
      style: {
        stroke: '#fff',
        strokeWidth: 1,
      },
    });
  }

  private _destroySelection() {
    if (this._selectionShape) {
      this._selectionShape.destroy();
      this._selectionShape = null;
    }
  }

  protected getDynamicCoordinates() {
    return this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  public syncCoordToData() {
    const { group, data } = this;
    const pointSize = data.points.length;

    for (let i = pointSize - 1; i < group.shapes.length; i++) {
      data.points[i - pointSize + 1].x = axis!.getOriginalX(group.shapes[i].dynamicCoordinate[0].x);
      data.points[i - pointSize + 1].y = axis!.getOriginalY(group.shapes[i].dynamicCoordinate[0].y);
    }
  }

  public destroy() {
    super.destroy();
    this._destroySelection();
    eventEmitter.off(EInternalEvent.KeyUp, this._onKeyUp);
  }

  public render(ctx: CanvasRenderingContext2D) {
    super.render(ctx);

    if (this._selectionShape) {
      this._selectionShape.render(ctx);
    }
  }
}
