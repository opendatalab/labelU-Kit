import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';
import type { BBox } from 'rbush';
import Color from 'color';

import { AnnotationCuboid, type CuboidData, type CuboidVertex } from '../annotations';
import type { AxisPoint, LineCoordinate, PointStyle, PolygonStyle } from '../shapes';
import { Line, Polygon, Point } from '../shapes';
// import { axis } from '../singletons';
import type { AnnotationParams } from '../annotations/Annotation';
import { Annotation } from '../annotations/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { DraftObserverMixin } from './DraftObserver';
import { ControllerEdge } from './ControllerEdge';
import type { CuboidToolOptions } from '../tools';
import { controllerBoundRelation, controllerSyncBackRelation, edgeBoundRelation } from './CuboidRelations';
import { axis } from '../singletons';

type ControllerPosition =
  | 'front-tl'
  | 'front-tr'
  | 'front-br'
  | 'front-bl'
  | 'back-tl'
  | 'back-tr'
  | 'back-br'
  | 'back-bl';

type EdgePosition =
  | 'front-top'
  | 'front-right'
  | 'front-bottom'
  | 'front-left'
  | 'back-top'
  | 'back-right'
  | 'back-bottom'
  | 'back-left';

type ZPosition = 'front' | 'back';

type LinePosition = keyof CuboidVertex;

type SimpleEdgePosition = 'top' | 'right' | 'bottom' | 'left';

const oppositePositionMapping: Record<ZPosition, ZPosition> = {
  front: 'back',
  back: 'front',
};

/**
 * 立体框草稿
 * @description 一个立体框草稿由前后 1 个多边形做正面的背景色填充 + 8个控制点 + 4条线段 + 8个控制边组成
 */
export class DraftCuboid extends DraftObserverMixin(
  Annotation<CuboidData, ControllerEdge | Point | Line | Polygon, PolygonStyle | PointStyle>,
) {
  public config: CuboidToolOptions;

  private _preBBox: BBox | null = null;

  private _unscaledPreBBox: BBox | null = null;

  /**
   * 透视比例
   */
  private _perspectiveWidthRatio: number = 1;

  private _perspectiveHeightRatio: number = 1;

  private _frontSizeRatio: number = 1;

  private _backSizeRatio: number = 1;

  private _previousDynamicCoordinates: AxisPoint[][] | null = null;

  private _oppositeControllerDynamicCoordinates: AxisPoint[] | null = null;

  /**
   * 控制点
   */
  private _controllerPositionMapping: Map<ControllerPosition, ControllerPoint> = new Map();

  /**
   * 控制边
   */
  private _edgePositionMapping: Map<EdgePosition, ControllerEdge> = new Map();

  private _realFrontPolygon: Polygon | null = null;

  private _connectedLineMapping: Map<LinePosition, Line> = new Map();

  constructor(config: CuboidToolOptions, params: AnnotationParams<CuboidData, PolygonStyle>) {
    super(params);

    this.config = config;
    this.labelColor = AnnotationCuboid.labelStatic.getLabelColor(this.data.label);

    this._setupShapes();
    this.onMouseUp(this._onMouseUp);
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    // 添加连线
    this._setupLines();

    // 先渲染背面，正面要盖在背面上
    this._setupRects('back');
    this._setupRects('front');

    // 给真正的正面添加背景色
    const realFrontCoordinates = AnnotationCuboid.generateFrontCoordinate(this.data);
    const realFront = new Polygon({
      id: uuid(),
      coordinate: realFrontCoordinates,
      style: {
        fill: Color(this.labelColor).alpha(0.5).string(),
        strokeWidth: 0,
        stroke: 'transparent',
        opacity: 0.5,
      },
    });
    this._realFrontPolygon = realFront;
    this.group.add(realFront);
    this._setupControllerPoints('back');
    this._setupControllerPoints('front');
  }

  /**
   * 构建前后由控制边组成的多边形
   */
  private _setupRects(position: 'front' | 'back') {
    const { data, group, style, labelColor } = this;

    const { tl, tr, br, bl } = data[position];
    const edgeCoordinates = [
      {
        name: `${position}-top`,
        coordinate: [tl, tr],
      },
      {
        name: `${position}-right`,
        coordinate: [tr, br],
      },
      {
        name: `${position}-bottom`,
        coordinate: [br, bl],
      },
      {
        name: `${position}-left`,
        coordinate: [bl, tl],
      },
    ];

    for (let i = 0; i < edgeCoordinates.length; i++) {
      // 背面底边不可控制
      if (edgeCoordinates[i].name === 'back-bottom') {
        const line = new Line({
          id: uuid(),
          coordinate: cloneDeep(edgeCoordinates[i].coordinate) as LineCoordinate,
          style: {
            ...style,
            stroke: labelColor,
          },
        });
        group.add(line);
        this._edgePositionMapping.set(edgeCoordinates[i].name as EdgePosition, line as ControllerEdge);
        continue;
      }
      const edge = new ControllerEdge({
        id: uuid(),
        name: edgeCoordinates[i].name,
        coordinate: cloneDeep(edgeCoordinates[i].coordinate) as LineCoordinate,
        style: {
          ...style,
          stroke: labelColor,
        },
      });

      this._edgePositionMapping.set(edgeCoordinates[i].name as EdgePosition, edge);

      edge.onMouseDown(this._onEdgeDown);
      edge.onMove(this._onEdgeMove);
      edge.onMouseUp(this._onEdgeUp);

      group.add(edge);
    }
  }

  private _setupControllerPoints(position: 'front' | 'back') {
    const { data, group } = this;

    const { tl, tr, br, bl } = data[position];

    const controllerCoordinates = [
      {
        name: `${position}-tl`,
        coordinate: tl,
      },
      {
        name: `${position}-tr`,
        coordinate: tr,
      },
      {
        name: `${position}-br`,
        coordinate: br,
      },
      {
        name: `${position}-bl`,
        coordinate: bl,
      },
    ];

    for (let i = 0; i < controllerCoordinates.length; i++) {
      // 控制点
      const point = new ControllerPoint({
        id: uuid(),
        name: controllerCoordinates[i].name,
        outOfImage: this.config.outOfImage,
        coordinate: cloneDeep(controllerCoordinates[i].coordinate),
      });

      this._controllerPositionMapping.set(controllerCoordinates[i].name as ControllerPosition, point);

      point.onMouseDown(this._onControllerPointDown);
      point.onMove(this._onControllerPointMove);
      point.onMouseUp(this._onControllerPointUp);

      group.add(point);
    }
  }

  private _setupLines() {
    const { data, group, style, labelColor } = this;

    const { front, back } = data;
    const lineCoordinates = [
      {
        name: 'tl',
        coordinate: [front.tl, back.tl],
      },
      {
        name: 'tr',
        coordinate: [front.tr, back.tr],
      },
      {
        name: 'br',
        coordinate: [front.br, back.br],
      },
      {
        name: 'bl',
        coordinate: [front.bl, back.bl],
      },
    ];

    for (let i = 0; i < lineCoordinates.length; i++) {
      const line = new Line({
        id: uuid(),
        coordinate: cloneDeep(lineCoordinates[i].coordinate) as LineCoordinate,
        style: {
          ...style,
          stroke: labelColor,
        },
      });

      this._connectedLineMapping.set(lineCoordinates[i].name as LinePosition, line);

      group.add(line);
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

  private _setRatio() {
    const { data } = this;

    const frontWidth = data.front.tr.x - data.front.tl.x;
    const frontHeight = data.front.bl.y - data.front.tl.y;
    const backWidth = data.back.tr.x - data.back.tl.x;
    const backHeight = data.back.bl.y - data.back.tl.y;

    this._perspectiveWidthRatio = frontWidth / backWidth;
    this._perspectiveHeightRatio = frontHeight / backHeight;
    this._frontSizeRatio = frontWidth / frontHeight;
    this._backSizeRatio = backWidth / backHeight;
  }

  private _getFrontSize() {
    const { _controllerPositionMapping } = this;

    const frontTopLeftPoint = _controllerPositionMapping.get('front-tl')!;
    const frontTopRightPoint = _controllerPositionMapping.get('front-tr')!;
    const frontBottomLeftPoint = _controllerPositionMapping.get('front-bl')!;

    return {
      width: frontTopRightPoint.dynamicCoordinate[0].x - frontTopLeftPoint.dynamicCoordinate[0].x,
      height: frontBottomLeftPoint.dynamicCoordinate[0].y - frontTopLeftPoint.dynamicCoordinate[0].y,
    };
  }

  private _getBackSize() {
    const { _controllerPositionMapping } = this;

    const backTopLeftPoint = _controllerPositionMapping.get('back-tl')!;
    const backTopRightPoint = _controllerPositionMapping.get('back-tr')!;
    const backBottomLeftPoint = _controllerPositionMapping.get('back-bl')!;

    return {
      width: backTopRightPoint.dynamicCoordinate[0].x - backTopLeftPoint.dynamicCoordinate[0].x,
      height: backBottomLeftPoint.dynamicCoordinate[0].y - backTopLeftPoint.dynamicCoordinate[0].y,
    };
  }

  private _refresh() {
    this.group.clear();
    this._setupShapes();
    axis?.rerender();
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
  private _onControllerPointDown = (controllerPoint: ControllerPoint) => {
    const { _controllerPositionMapping } = this;
    const [zPosition, position] = controllerPoint.name!.split('-') as [ZPosition, LinePosition];

    this._setRatio();
    this._oppositeControllerDynamicCoordinates = cloneDeep(
      _controllerPositionMapping.get(`${oppositePositionMapping[zPosition]}-${position}`)!.dynamicCoordinate,
    );
    this._previousDynamicCoordinates = this.getDynamicCoordinates();
  };

  /**
   * 移动控制点
   * @param ControllerPoint
   * @description 控制点移动规则
   *
   * 1. 视觉前方的控制点移动时，后方的控制点也要跟着移动，但是需要符合透视比例；
   * 2. 视觉后方的控制点移动时，前方的控制点不需要跟着移动，但是透视比例需要更新；
   * 3. 无论前后，对应的面的形状要符合透视比例。
   */
  private _onControllerPointMove = (controllerPoint: ControllerPoint, e: MouseEvent) => {
    const {
      config,
      _controllerPositionMapping,
      _edgePositionMapping,
      _previousDynamicCoordinates,
      _realFrontPolygon,
      _connectedLineMapping,
    } = this;

    if (!_realFrontPolygon) {
      return;
    }

    let [safeX, safeY] = config.outOfImage ? [true, true] : axis!.isCoordinatesSafe(_previousDynamicCoordinates!);

    const [zPosition, position] = controllerPoint.name!.split('-') as [ZPosition, LinePosition];

    // 控制前面
    if (zPosition === 'front') {
      const controllerRelation = controllerBoundRelation[`${zPosition}-${position}`];

      // TODO: 如果变换后更新了点的方位，可以不设置镜像变换的限制
      if (safeX) {
        if (position === 'tr' || position === 'br') {
          safeX = e.offsetX > _controllerPositionMapping.get('front-tl')!.dynamicCoordinate[0].x;
        }

        if (position === 'tl' || position === 'bl') {
          safeX = e.offsetX < _controllerPositionMapping.get('front-tr')!.dynamicCoordinate[0].x;
        }
      }

      if (safeY) {
        if (position === 'tr' || position === 'tl') {
          safeY = e.offsetY < _controllerPositionMapping.get('front-bl')!.dynamicCoordinate[0].y;
        }

        if (position === 'br' || position === 'bl') {
          safeY = e.offsetY > _controllerPositionMapping.get('front-tl')!.dynamicCoordinate[0].y;
        }
      }

      // 由控制点更新受影响的对象
      for (const shapeType in controllerRelation) {
        let mapping: Map<string, ControllerPoint | ControllerEdge | Line>;
        if (shapeType === 'controller') {
          mapping = _controllerPositionMapping;
        } else if (shapeType === 'edge') {
          mapping = _edgePositionMapping;
        } else {
          mapping = _connectedLineMapping;
        }

        controllerRelation[shapeType as 'edge' | 'controller' | 'line'].forEach(({ name, coordinates }) => {
          const shape = mapping.get(name as ControllerPosition | EdgePosition | LinePosition)!;

          coordinates.forEach(({ index, fields }) => {
            fields.forEach((field) => {
              if (safeX && field === 'x') {
                shape.coordinate[index].x = controllerPoint.plainCoordinate[0].x;
              }

              if (safeY && field === 'y') {
                shape.coordinate[index].y = controllerPoint.plainCoordinate[0].y;
              }
            });
          });
        });
      }

      // 按透视比例更新后面的图形
      const syncBackRelation = controllerSyncBackRelation[`${zPosition}-${position}`];
      const frontDistance = axis!.distance;
      const backDistance = {
        x: frontDistance.x / this._perspectiveWidthRatio,
        y: frontDistance.y / this._perspectiveHeightRatio,
      };
      const backMirrorControllerCoordinate = this._oppositeControllerDynamicCoordinates!.map((point) => ({
        x: point.x + backDistance.x,
        y: point.y + backDistance.y,
      }));

      for (const shapeType in syncBackRelation) {
        let mapping: Map<string, ControllerPoint | ControllerEdge | Line>;
        if (shapeType === 'controller') {
          mapping = _controllerPositionMapping;
        } else if (shapeType === 'edge') {
          mapping = _edgePositionMapping;
        } else {
          mapping = _connectedLineMapping;
        }

        syncBackRelation[shapeType as 'edge' | 'controller' | 'line'].forEach(({ name, coordinates }) => {
          const shape = mapping.get(name as ControllerPosition | EdgePosition | LinePosition)!;

          coordinates.forEach(({ index, fields }) => {
            fields.forEach((field) => {
              if (safeX && field === 'x') {
                shape.coordinate[index].x = axis!.getOriginalX(backMirrorControllerCoordinate[0].x);
              }

              if (safeY && field === 'y') {
                shape.coordinate[index].y = axis!.getOriginalY(backMirrorControllerCoordinate[0].y);
              }
            });
          });
        });
      }

      // 更新到数据，便于从数据生成正面的多边形坐标
      if (safeX && safeY) {
        this.syncCoordToData();
      }

      const realPolygonCoordinate = AnnotationCuboid.generateFrontCoordinate(this.data);
      this._realFrontPolygon?.plainCoordinate.forEach((point, index) => {
        if (safeX) {
          this._realFrontPolygon!.coordinate[index].x = realPolygonCoordinate[index].x;
        }

        if (safeY) {
          this._realFrontPolygon!.coordinate[index].y = realPolygonCoordinate[index].y;
        }
      });
    } else {
      // 控制后面
    }

    // 手动更新组合的包围盒
    this.group.update();
  };

  /**
   * 释放控制点
   */
  private _onControllerPointUp = () => {
    this._oppositeControllerDynamicCoordinates = null;
    this._previousDynamicCoordinates = null;
  };

  // ========================== 控制边 ==========================

  private _onEdgeDown = () => {
    // this._updateControllerAndEdgeAndPreBBox();
  };

  /**
   * 控制边的移动
   */
  private _onEdgeMove = (_e: MouseEvent, edge: ControllerEdge) => {
    const { _controllerPositionMapping, _edgePositionMapping, _connectedLineMapping, config } = this;

    const x = axis!.getOriginalX(edge.previousDynamicCoordinate![0].x + axis!.distance.x);
    const y = axis!.getOriginalY(edge.previousDynamicCoordinate![0].y + axis!.distance.y);

    const [safeX, safeY] = config.outOfImage ? [true, true] : axis!.isCoordinatesSafe(edge.previousDynamicCoordinate!);

    const [zPosition, position] = edge.name!.split('-') as [ZPosition, SimpleEdgePosition];

    if (safeX && (position === 'left' || position === 'right')) {
      edge.coordinate[0].x = x;
      edge.coordinate[1].x = x;
    }

    if (safeY && (position === 'top' || position === 'bottom')) {
      edge.coordinate[0].y = y;
      edge.coordinate[1].y = y;
    }

    if (zPosition === 'front') {
      // 由控制边更新受影响的对象
      const edgeRelation = edgeBoundRelation[`${zPosition}-${position}`];

      for (const shapeType in edgeRelation) {
        let mapping: Map<string, ControllerPoint | ControllerEdge | Line>;
        if (shapeType === 'controller') {
          mapping = _controllerPositionMapping;
        } else if (shapeType === 'edge') {
          mapping = _edgePositionMapping;
        } else {
          mapping = _connectedLineMapping;
        }

        edgeRelation[shapeType as 'edge' | 'controller' | 'line'].forEach(({ name, coordinates }) => {
          const shape = mapping.get(name as ControllerPosition | EdgePosition | LinePosition)!;

          coordinates.forEach(({ index, fields, edgeCoordIndex }) => {
            fields.forEach((field) => {
              shape.coordinate[index][field as 'x' | 'y'] = edge.plainCoordinate[edgeCoordIndex][field as 'x' | 'y'];
            });
          });
        });
      }
    }

    // const { config, _controllerPositionMapping, _edgePositionMapping, _unscaledPreBBox } = this;

    this.group.update();
  };

  private _onEdgeUp = () => {
    this._preBBox = null;
    this.syncCoordToData();
  };

  /**
   * 更新控制点和控制边及其方位信息
   */
  // private _updateControllerAndEdgeAndPreBBox() {
  //   this._preBBox = this._getBBox();
  //   this._unscaledPreBBox = {
  //     minX: axis!.getOriginalX(this._preBBox!.minX),
  //     minY: axis!.getOriginalY(this._preBBox!.minY),
  //     maxX: axis!.getOriginalX(this._preBBox!.maxX),
  //     maxY: axis!.getOriginalY(this._preBBox!.maxY),
  //   };

  //   const { group, _unscaledPreBBox, _edgePositionMapping, _controllerPositionMapping } = this;
  //   const { minX, minY, maxX, maxY } = _unscaledPreBBox;

  //   group.each((shape) => {
  //     if (shape instanceof ControllerPoint) {
  //       const [point] = shape.plainCoordinate;

  //       if (point.x === minX && point.y === minY) {
  //         shape.name = 'nw';
  //         _controllerPositionMapping.set('nw', shape);
  //       }

  //       if (point.x === maxX && point.y === minY) {
  //         shape.name = 'ne';
  //         _controllerPositionMapping.set('ne', shape);
  //       }

  //       if (point.x === maxX && point.y === maxY) {
  //         shape.name = 'se';
  //         _controllerPositionMapping.set('se', shape);
  //       }

  //       if (point.x === minX && point.y === maxY) {
  //         shape.name = 'sw';
  //         _controllerPositionMapping.set('sw', shape);
  //       }
  //     }

  //     if (shape instanceof ControllerEdge) {
  //       const [start, end] = shape.plainCoordinate;

  //       if (
  //         (start.x === minX && start.y === minY && end.x === maxX && end.y === minY) ||
  //         (start.x === maxX && start.y === minY && end.x === minX && end.y === minY)
  //       ) {
  //         shape.name = 'top';
  //         _edgePositionMapping.set('top', shape);
  //         shape.coordinate = [
  //           {
  //             x: minX,
  //             y: minY,
  //           },
  //           {
  //             x: maxX,
  //             y: minY,
  //           },
  //         ];
  //       }

  //       if (
  //         (start.x === maxX && start.y === minY && end.x === maxX && end.y === maxY) ||
  //         (start.x === maxX && start.y === maxY && end.x === maxX && end.y === minY)
  //       ) {
  //         shape.name = 'right';
  //         _edgePositionMapping.set('right', shape);
  //         shape.coordinate = [
  //           {
  //             x: maxX,
  //             y: minY,
  //           },
  //           {
  //             x: maxX,
  //             y: maxY,
  //           },
  //         ];
  //       }

  //       if (
  //         (start.x === maxX && start.y === maxY && end.x === minX && end.y === maxY) ||
  //         (start.x === minX && start.y === maxY && end.x === maxX && end.y === maxY)
  //       ) {
  //         shape.name = 'bottom';
  //         _edgePositionMapping.set('bottom', shape);
  //         shape.coordinate = [
  //           {
  //             x: maxX,
  //             y: maxY,
  //           },
  //           {
  //             x: minX,
  //             y: maxY,
  //           },
  //         ];
  //       }

  //       if (
  //         (start.x === minX && start.y === maxY && end.x === minX && end.y === minY) ||
  //         (start.x === minX && start.y === minY && end.x === minX && end.y === maxY)
  //       ) {
  //         shape.name = 'left';
  //         _edgePositionMapping.set('left', shape);
  //         shape.coordinate = [
  //           {
  //             x: minX,
  //             y: maxY,
  //           },
  //           {
  //             x: minX,
  //             y: minY,
  //           },
  //         ];
  //       }
  //     }
  //   });
  // }

  protected getDynamicCoordinates() {
    return this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  public syncCoordToData() {
    const { data, _controllerPositionMapping } = this;

    _controllerPositionMapping.forEach((controllerPoint, key: ControllerPosition) => {
      const [direction, position] = key.split('-') as [ZPosition, LinePosition];

      data[direction][position].x = controllerPoint.plainCoordinate[0].x;
      data[direction][position].y = controllerPoint.plainCoordinate[0].y;
    });
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
