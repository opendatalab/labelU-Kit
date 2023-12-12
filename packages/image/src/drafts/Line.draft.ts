import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { LineData } from '../annotation';
import type { AxisPoint, PointStyle } from '../shapes';
import { Rect, Point } from '../shapes';
import { axis } from '../singletons';
import type { AnnotationParams } from '../annotation/Annotation';
import { Annotation } from '../annotation/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { DraftObserverMixin } from './DraftObserver';
import type { LineToolOptions } from '../tools';

export class DraftLine extends DraftObserverMixin(Annotation<LineData, Line | Point, LineStyle | PointStyle>) {
  public config: LineToolOptions;

  private _selectionShape: Rect | null = null;

  private _isControllerPicked: boolean = false;

  private _effectedLines: [Line | undefined, Line | undefined] | null = null;

  private _previousDynamicCoordinates: AxisPoint[][] | null = null;

  constructor(config: LineToolOptions, params: AnnotationParams<LineData, LineStyle>) {
    super(params);

    this.config = config;

    this._setupShapes();
    this.onMouseDown(this._onMouseDown);
    this.onMove(this._onMouseMove);
    this.onMouseUp(this._onMouseUp);
    this._createSelection();
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style, config } = this;

    for (let i = 1; i < data.pointList.length; i++) {
      const startPoint = axis!.convertSourceCoordinate(data.pointList[i - 1]);
      const endPoint = axis!.convertSourceCoordinate(data.pointList[i]);

      const line = new Line({
        id: uuid(),
        coordinate: [startPoint, endPoint],
        style,
      });

      group.add(line);
    }

    // 点要覆盖在线上
    for (let i = 0; i < data.pointList.length; i++) {
      const pointItem = data.pointList[i];
      const point = new ControllerPoint({
        id: pointItem.id,
        outOfCanvas: config.outOfCanvas,
        // 深拷贝，避免出现引用问题
        coordinate: axis!.convertSourceCoordinate(pointItem),
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
    const { _selectionShape, _isControllerPicked } = this;

    // 选中控制点时，不需要选中草稿
    if (_isControllerPicked) {
      return;
    }

    if (_selectionShape) {
      this._isControllerPicked = false;
      this.isPicked = true;
      this._previousDynamicCoordinates = this.getDynamicCoordinates();
    }
  };

  /**
   * 移动草稿
   */
  private _onMouseMove = () => {
    const { isPicked, _previousDynamicCoordinates, config } = this;

    if (!isPicked || !_previousDynamicCoordinates) {
      return;
    }

    this._destroySelection();

    const [safeX, safeY] = config.outOfCanvas ? [true, true] : axis!.isCoordinatesSafe(_previousDynamicCoordinates);

    // 更新草稿坐标
    this.group.each((shape, index) => {
      const startPoint = axis!.getOriginalCoord({
        x: _previousDynamicCoordinates[index][0].x + axis!.distance.x,
        y: _previousDynamicCoordinates[index][0].y + axis!.distance.y,
      });

      if (shape instanceof Point) {
        if (safeX) {
          shape.coordinate[0].x = startPoint.x;
        }

        if (safeY) {
          shape.coordinate[0].y = startPoint.y;
        }
      } else {
        const endPoint = axis!.getOriginalCoord({
          x: _previousDynamicCoordinates[index][1].x + axis!.distance.x,
          y: _previousDynamicCoordinates[index][1].y + axis!.distance.y,
        });

        if (safeX) {
          shape.coordinate[0].x = startPoint.x;
          shape.coordinate[1].x = endPoint.x;
        }

        if (safeY) {
          shape.coordinate[0].y = startPoint.y;
          shape.coordinate[1].y = endPoint.y;
        }
      }
    });

    // 手动更新组合的包围盒
    this.group.update();
    // 手动将坐标同步到数据
    this.syncCoordToData();
  };

  private _onMouseUp = () => {
    this._createSelection();
    this.isPicked = false;
    this._previousDynamicCoordinates = null;
  };

  /**
   * 按下控制点
   * @param point
   * @description 按下控制点时，记录受影响的线段
   */
  private _onControllerPointDown = (point: ControllerPoint) => {
    this._effectedLines = [undefined, undefined];
    this._isControllerPicked = true;

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
    const { _effectedLines } = this;
    const x = coordinate[0].x;
    const y = coordinate[0].y;

    if (!_effectedLines) {
      return;
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
    this._isControllerPicked = false;
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

  public get isControllerPicked() {
    return this._isControllerPicked;
  }

  public syncCoordToData() {
    const { group, data } = this;
    const pointSize = data.pointList.length;

    for (let i = pointSize - 1; i < group.shapes.length; i++) {
      data.pointList[i - pointSize + 1].x = axis!.convertCanvasCoordinateX(group.shapes[i].dynamicCoordinate[0].x);
      data.pointList[i - pointSize + 1].y = axis!.convertCanvasCoordinateY(group.shapes[i].dynamicCoordinate[0].y);
    }
  }

  public destroy() {
    super.destroy();
    this._destroySelection();
  }

  public render(ctx: CanvasRenderingContext2D) {
    super.render(ctx);

    if (this._selectionShape) {
      this._selectionShape.render(ctx);
    }
  }
}
