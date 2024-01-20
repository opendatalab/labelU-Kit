import cloneDeep from 'lodash.clonedeep';
import Color from 'color';

import type { LineStyle, Line } from '../shapes/Line.shape';
import { Annotation, AnnotationLine, type LineData } from '../annotations';
import type { PointStyle, Point } from '../shapes';
import { Spline } from '../shapes';
import type { AnnotationParams } from '../annotations/Annotation';
import type { ControllerPoint } from './ControllerPoint';
import { Draft } from './Draft';
import type { LineToolOptions } from '../tools';
import { SlopeEdge } from './SlopeEdge';
import { EInternalEvent } from '../enums';

interface EffectedCurve {
  position: 'start' | 'end';
  curve: Spline;
}

export class DraftLineCurve extends Draft<LineData, Line | Point | any, LineStyle | PointStyle> {
  public config: LineToolOptions;

  private _isControllerPicked: boolean = false;

  private _effectedCurves: EffectedCurve[] = [];

  constructor(config: LineToolOptions, params: AnnotationParams<LineData, LineStyle>) {
    super(params);

    this.config = config;
    this.labelColor = AnnotationLine.labelStatic.getLabelColor(this.data.label);
    this.strokeColor = Color(this.labelColor).alpha(Annotation.strokeOpacity).string();

    this._setupShapes();
    this.onMouseUp(this._onMouseUp);
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style, strokeColor } = this;

    const controlPoints = AnnotationLine.chunk(data.controlPoints!, 2);

    for (let i = 1; i < data.points.length; i++) {
      const startPoint = data.points[i - 1];
      const endPoint = data.points[i];
      const [startControlPoint, endControlPoint] = controlPoints[i - 1];

      const curve = new Spline({
        id: data.points[i - 1].id,
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
    const slopePoints = AnnotationLine.makeControlPointsByPointList(data.controlPoints!);
    for (let i = 0; i < data.points.length; i++) {
      // 增加曲率控制点，跟点的关系是 2n - 2
      const contact = data.points[i];
      const currentControls = slopePoints[i];

      let edge: SlopeEdge;
      if (i === 0) {
        edge = new SlopeEdge({
          startControlOfNextCurve: { ...currentControls[0] },
          contact,
        });
      } else if (i === data.points.length - 1) {
        edge = new SlopeEdge({
          contact,
          endControlOfPrevCurve: { ...currentControls[0] },
        });
      } else {
        edge = new SlopeEdge({
          endControlOfPrevCurve: { ...currentControls[0] },
          startControlOfNextCurve: { ...currentControls[1] },
          contact,
        });
      }
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

    this.group.each((shape) => {
      if (shape instanceof Spline) {
        if (
          shape.dynamicCoordinate[0].x === contactPoint.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[0].y === contactPoint.dynamicCoordinate[0].y
        ) {
          this._effectedCurves.push({
            position: 'start',
            curve: shape,
          });
        }
        if (
          shape.dynamicCoordinate[1].x === contactPoint.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[1].y === contactPoint.dynamicCoordinate[0].y
        ) {
          this._effectedCurves.push({
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
    const { _effectedCurves } = this;
    const x = coordinate[0].x;
    const y = coordinate[0].y;

    if (!_effectedCurves) {
      return;
    }

    _effectedCurves.forEach(({ curve, position }) => {
      if (position === 'start') {
        curve.coordinate[0].x = x;
        curve.coordinate[0].y = y;
        curve.controlPoints[0] = { ...slopeEndPoint.coordinate[0] };
      } else if (position === 'end') {
        curve.coordinate[1].x = x;
        curve.coordinate[1].y = y;
        curve.controlPoints[1] = { ...slopeStartPoint.coordinate[0] };
      }
    });

    // 手动更新组合的包围盒
    this.group.update();
  };

  private _onSlopePointDown = (point: ControllerPoint, contact: ControllerPoint) => {
    this.group.each((shape) => {
      if (shape instanceof Spline) {
        if (
          point.name === 'start' &&
          shape.dynamicCoordinate[0].x === contact.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[0].y === contact.dynamicCoordinate[0].y
        ) {
          this._effectedCurves.push({
            position: 'start',
            curve: shape,
          });
        }
        if (
          point.name === 'end' &&
          shape.dynamicCoordinate[1].x === contact.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[1].y === contact.dynamicCoordinate[0].y
        ) {
          this._effectedCurves.push({
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
    const { _effectedCurves } = this;

    _effectedCurves.forEach(({ curve, position }) => {
      if (position === 'start') {
        curve.controlPoints[0] = { ...point.coordinate[0] };
      } else if (position === 'end') {
        curve.controlPoints[1] = { ...point.coordinate[0] };
      }
    });
  };

  private _onSlopePointUp = () => {
    this._effectedCurves = [];
    this.syncCoordToData();
  };

  /**
   * 释放控制点
   */
  private _onContactPointUp = () => {
    this._isControllerPicked = false;
    this._effectedCurves = [];
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

    data.controlPoints = controlPoints;
  }
}
