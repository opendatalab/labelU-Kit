import cloneDeep from 'lodash.clonedeep';
import Color from 'color';

import type { LineStyle, Line } from '../shapes/Line.shape';
import type { PolygonData } from '../annotations';
import { AnnotationLine, AnnotationPolygon } from '../annotations';
import type { PointStyle, Point, PolygonStyle, AxisPoint } from '../shapes';
import { Spline, ClosedSpline } from '../shapes';
import type { AnnotationParams } from '../annotations/Annotation';
import type { ControllerPoint } from './ControllerPoint';
import { Draft } from './Draft';
import type { PolygonToolOptions } from '../tools';
import { SlopeEdge } from './SlopeEdge';
import { EInternalEvent } from '../enums';

interface EffectedCurve {
  position: 'start' | 'end';
  curve: Spline;
}

export class DraftPolygonCurve extends Draft<PolygonData, Line | Point | any, LineStyle | PointStyle> {
  public config: PolygonToolOptions;

  private _isControllerPicked: boolean = false;

  private _effectedSplines: EffectedCurve[] = [];

  private _pointIndex: number | null = null;

  constructor(config: PolygonToolOptions, params: AnnotationParams<PolygonData, PolygonStyle>) {
    super({ ...params, name: 'polygon', labelColor: AnnotationPolygon.labelStatic.getLabelColor(params.data.label) });

    this.config = config;

    this._setupShapes();
    this.onMouseUp(this._onMouseUp);
    this.finishSetup();
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style, labelColor, strokeColor } = this;

    group.add(
      // 多边形用于颜色填充
      new ClosedSpline({
        id: data.id,
        controlPoints: data.controlPoints!,
        coordinate: cloneDeep(data.points),
        style: { ...style, strokeWidth: 0, stroke: 'transparent', fill: Color(labelColor).alpha(0.3).toString() },
      }),
    );

    const controlPoints = AnnotationLine.chunk(data.controlPoints!, 2);
    const fullPoints = [...data.points, data.points[0]];

    for (let i = 1; i < fullPoints.length; i++) {
      const startPoint = fullPoints[i - 1];
      const endPoint = fullPoints[i];
      const [startControlPoint, endControlPoint] = controlPoints[i - 1];

      const curve = new Spline({
        id: fullPoints[i - 1].id,
        coordinate: [{ ...startPoint }, { ...endPoint }],
        controlPoints: [{ ...startControlPoint }, { ...endControlPoint }],
        style: {
          ...style,
          stroke: strokeColor,
        },
      });

      group.add(curve);
    }

    // 根据曲线切点转换的控制点
    const slopePoints = AnnotationPolygon.makeControlPointsByPointList(data.controlPoints!);
    for (let i = 0; i < data.points.length; i++) {
      // 增加曲率控制点，跟点的关系是 2n
      const contact = data.points[i];
      const currentControls = slopePoints[i];

      const edge: SlopeEdge = new SlopeEdge({
        endControlOfPrevCurve: { ...currentControls[0] },
        startControlOfNextCurve: { ...currentControls[1] },
        contact,
      });

      edge.on(EInternalEvent.ContactDown, this._onContactPointDown);
      edge.on(EInternalEvent.ContactMove, this._onContactPointMove);
      edge.on(EInternalEvent.ContactUp, this._onContactPointUp);
      edge.on(EInternalEvent.SlopeDown, this._onSlopePointDown);
      edge.on(EInternalEvent.SlopeMove, this._onSlopePointMove);
      edge.on(EInternalEvent.SlopeUp, this._onSlopePointUp);

      group.add(edge);
    }
  }

  private _onMouseUp = () => {
    // 手动将坐标同步到数据
    this.syncCoordToData();
  };

  /**
   * 按下切点
   * @description 按下控制点时，记录受影响的曲线
   * @param point 切点控制点
   */
  private _onContactPointDown = (contactPoint: ControllerPoint) => {
    this._isControllerPicked = true;

    this._pointIndex = this.group.shapes[0].coordinate.findIndex(
      (item: AxisPoint) => item.x === contactPoint.coordinate[0].x && item.y === contactPoint.coordinate[0].y,
    );

    this.group.each((shape) => {
      if (shape instanceof Spline) {
        if (
          shape.dynamicCoordinate[0].x === contactPoint.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[0].y === contactPoint.dynamicCoordinate[0].y
        ) {
          this._effectedSplines.push({
            position: 'start',
            curve: shape,
          });
        }
        if (
          shape.dynamicCoordinate[1].x === contactPoint.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[1].y === contactPoint.dynamicCoordinate[0].y
        ) {
          this._effectedSplines.push({
            position: 'end',
            curve: shape,
          });
        }
      }
    });
  };

  /**
   * 移动控制点
   * @param changedCoordinate
   * @description 控制点移动时，更新线段的端点
   */
  private _onContactPointMove = (
    { coordinate }: ControllerPoint,
    slopeStartPoint: ControllerPoint,
    slopeEndPoint: ControllerPoint,
  ) => {
    const { _effectedSplines, _pointIndex, group } = this;
    const x = coordinate[0].x;
    const y = coordinate[0].y;

    if (!_effectedSplines || _pointIndex === null) {
      return;
    }

    const closedSpline = group.shapes[0] as ClosedSpline;

    // 更新多边形曲线切点坐标
    closedSpline.coordinate[_pointIndex] = { x, y };

    // 更新曲线边框的控制点坐标
    _effectedSplines.forEach(({ curve, position }) => {
      if (position === 'start') {
        curve.coordinate[0].x = x;
        curve.coordinate[0].y = y;
        curve.controlPoints[0] = { ...slopeEndPoint.coordinate[0] };
        // 更新多边形曲线的控制点坐标
        closedSpline.updateControlPointByPointIndex(_pointIndex, 'start', { ...slopeEndPoint.coordinate[0] });
      } else if (position === 'end') {
        curve.coordinate[1].x = x;
        curve.coordinate[1].y = y;
        curve.controlPoints[1] = { ...slopeStartPoint.coordinate[0] };
        // 更新多边形曲线的控制点坐标
        closedSpline.updateControlPointByPointIndex(_pointIndex, 'end', { ...slopeStartPoint.coordinate[0] });
      }
    });

    // 手动更新组合的包围盒
    this.group.update();
  };

  private _onSlopePointDown = (point: ControllerPoint, contact: ControllerPoint) => {
    this._pointIndex = this.group.shapes[0].coordinate.findIndex(
      (item: AxisPoint) => item.x === contact.coordinate[0].x && item.y === contact.coordinate[0].y,
    );
    this.group.each((shape) => {
      if (shape instanceof Spline) {
        if (
          point.name === 'start' &&
          shape.dynamicCoordinate[0].x === contact.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[0].y === contact.dynamicCoordinate[0].y
        ) {
          this._effectedSplines.push({
            position: 'start',
            curve: shape,
          });
        }
        if (
          point.name === 'end' &&
          shape.dynamicCoordinate[1].x === contact.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[1].y === contact.dynamicCoordinate[0].y
        ) {
          this._effectedSplines.push({
            position: 'end',
            curve: shape,
          });
        }
      }
    });
  };

  /**
   * 移动曲率控制点
   * @param point 曲率控制点
   * @description 曲率控制点移动时，更新曲线的控制点
   * TODO: 按住shift，另一边的控制点也镜像移动
   */
  private _onSlopePointMove = (point: ControllerPoint) => {
    const { _effectedSplines, _pointIndex, group } = this;
    const closedSpline = group.shapes[0] as ClosedSpline;

    if (_pointIndex === null) {
      return;
    }

    _effectedSplines.forEach(({ curve, position }) => {
      if (position === 'start') {
        curve.controlPoints[0] = { ...point.coordinate[0] };
        closedSpline.updateControlPointByPointIndex(_pointIndex, 'start', { ...point.coordinate[0] });
      } else if (position === 'end') {
        curve.controlPoints[1] = { ...point.coordinate[0] };
        closedSpline.updateControlPointByPointIndex(_pointIndex, 'end', { ...point.coordinate[0] });
      }
    });
  };

  private _onSlopePointUp = () => {
    this._effectedSplines = [];
    this._pointIndex = null;
    this.syncCoordToData();
  };

  /**
   * 释放控制点
   */
  private _onContactPointUp = () => {
    this._isControllerPicked = false;
    this._effectedSplines = [];
    this._pointIndex = null;
    this.syncCoordToData();
  };

  protected getDynamicCoordinates() {
    return this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  public get isControllerPicked() {
    return this._isControllerPicked;
  }

  public syncCoordToData() {
    const { group, data } = this;
    const pointSize = data.points.length;
    const edges = group.shapes.slice(-pointSize) as unknown as SlopeEdge[];

    const controlPoints = [];

    for (let i = 0; i < edges.length; i++) {
      data.points[i].x = edges[i].contactPoint!.plainCoordinate[0].x;
      data.points[i].y = edges[i].contactPoint!.plainCoordinate[0].y;

      if (edges[i].endControlOfPrevCurve) {
        controlPoints.push(edges[i].endControlOfPrevCurve!.plainCoordinate[0]);
      }

      if (edges[i].startControlOfNextCurve) {
        controlPoints.push(edges[i].startControlOfNextCurve!.plainCoordinate[0]);
      }
    }

    // 添加的控制点是按照切点的顺序添加的，所以需要按照曲线的顺序重新编排，把第一个控制点放最后
    controlPoints.push(controlPoints.shift()!);
    data.controlPoints = controlPoints;
  }
}
