import cloneDeep from 'lodash.clonedeep';
import Color from 'color';

import uid from '@/utils/uid';

import { AnnotationCuboid, type CuboidData, type CuboidVertex } from '../../annotations';
import type { AxisPoint, LineCoordinate, PointStyle, PolygonStyle, Point } from '../../shapes';
import { Line, Polygon } from '../../shapes';
import type { AnnotationParams } from '../../annotations/Annotation';
import { Annotation } from '../../annotations/Annotation';
import { ControllerPoint } from '../ControllerPoint';
import { Draft } from '../Draft';
import { ControllerEdge } from '../ControllerEdge';
import type { CuboidToolOptions } from '../../tools';
import { axis, eventEmitter } from '../../singletons';
import { DomPortal } from '../../core/DomPortal';
import domString from './domString';

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

/**
 * 立体框草稿
 * @description 一个立体框草稿由前后 1 个多边形做正面的背景色填充 + 8个控制点 + 4条线段 + 8个控制边组成
 */
export class DraftCuboid extends Draft<CuboidData, ControllerEdge | Point | Line | Polygon, PolygonStyle | PointStyle> {
  public config: CuboidToolOptions;

  private _previousDynamicCoordinate: AxisPoint[] | null = null;

  private _prevControllerDynamicCoordinates: Map<ControllerPosition, AxisPoint> = new Map();

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

  /**
   * 变换前的前面高度
   */
  private _preFrontHeight: number = 0;

  /**
   * 变换前的后面高度
   */
  private _preBackHeight: number = 0;

  private _dom: DomPortal | null = null;

  private _timer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: CuboidToolOptions, params: AnnotationParams<CuboidData, PolygonStyle>) {
    super({ ...params, name: 'cuboid', labelColor: AnnotationCuboid.labelStatic.getLabelColor(params.data.label) });

    this.config = config;

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
    this._setupEdges('back');
    this._setupEdges('front');

    // 给真正的正面添加背景色
    const realFrontCoordinates = AnnotationCuboid.generateFrontCoordinate(this.data);
    const realFront = new Polygon({
      id: uid(),
      coordinate: realFrontCoordinates,
      style: {
        fill: Color(this.labelColor).alpha(Annotation.fillOpacity).string(),
        strokeWidth: 0,
        stroke: 'transparent',
        opacity: 0.5,
      },
    });
    this._realFrontPolygon = realFront;
    this.group.add(realFront);
    this._setupControllerPoints('back');
    this._setupControllerPoints('front');
    this._setupDom();
  }

  /**
   * 构建前后由控制边组成的多边形
   */
  private _setupEdges(position: 'front' | 'back') {
    const { data, group, style, strokeColor } = this;

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
      // 后面只有左边和右边可以控制
      if (['back-top', 'back-bottom'].includes(edgeCoordinates[i].name)) {
        const line = new Line({
          id: uid(),
          coordinate: cloneDeep(edgeCoordinates[i].coordinate) as LineCoordinate,
          style: {
            ...style,
            stroke: strokeColor,
            strokeWidth: Annotation.strokeWidth,
          },
        });

        this._edgePositionMapping.set(edgeCoordinates[i].name as EdgePosition, line as ControllerEdge);
        group.add(line);
      } else {
        const edge = new ControllerEdge({
          id: uid(),
          name: edgeCoordinates[i].name,
          disabled: !this.requestEdit('edit'),
          coordinate: cloneDeep(edgeCoordinates[i].coordinate) as LineCoordinate,
          style: {
            ...style,
            stroke: strokeColor,
            strokeWidth: Annotation.strokeWidth,
          },
        });

        this._edgePositionMapping.set(edgeCoordinates[i].name as EdgePosition, edge);

        edge.onMouseDown(this._onEdgeDown);
        edge.onMove(this._onEdgeMove);
        edge.onMouseUp(this._onEdgeUp);

        group.add(edge);
      }
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
        id: uid(),
        name: controllerCoordinates[i].name,
        outOfImage: this.config.outOfImage,
        disabled: !this.requestEdit('edit'),
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
    const { data, group, style, strokeColor } = this;

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
        id: uid(),
        coordinate: cloneDeep(lineCoordinates[i].coordinate) as LineCoordinate,
        style: {
          ...style,
          stroke: strokeColor,
          strokeWidth: Annotation.strokeWidth,
        },
      });

      this._connectedLineMapping.set(lineCoordinates[i].name as LinePosition, line);

      group.add(line);
    }
  }

  private _setupDom() {
    const { _controllerPositionMapping } = this;

    if (this._dom) {
      this._dom.destroy();
    }

    const controlFrontTl = _controllerPositionMapping.get('front-tl');

    const elem = document.createElement('div');

    // 当this._dom被销毁后，这里的事件也会被销毁
    elem.addEventListener('mouseover', this._handleMouseOver);
    elem.addEventListener('mouseleave', this._handleMouseLeave);
    elem.addEventListener('click', this._handleSwitchDirection);

    elem.innerHTML = domString;

    this._dom = new DomPortal({
      x: controlFrontTl!.dynamicCoordinate[0].x,
      y: controlFrontTl!.dynamicCoordinate[0].y,
      offset: {
        x: -36,
        y: 10,
      },
      element: elem,
      bindShape: controlFrontTl!,
    });
  }

  private _handleMouseOver = (e: MouseEvent) => {
    const otherPerspective = document.getElementById('labelu_cuboid_other_perspective');
    const moreWrapper = document.getElementById('labelu_cuboid_more');
    const target = e.target as HTMLElement;

    if (target && otherPerspective && moreWrapper?.contains(target)) {
      otherPerspective.style.display = 'flex';

      if (this._timer) {
        clearTimeout(this._timer);
      }
    }
  };

  private _handleMouseLeave = () => {
    const otherPerspective = document.getElementById('labelu_cuboid_other_perspective');

    if (otherPerspective) {
      this._timer = setTimeout(function () {
        otherPerspective.style.display = 'none';
      }, 500);
    }
  };

  /**
   * 切换正面方向
   */
  private _handleSwitchDirection = (e: MouseEvent) => {
    const { data } = this;

    const frontBackSwitcher = document.getElementById('labelu_cuboid_switch_front_back');
    const leftSwitcher = document.getElementById('labelu_cuboid_left');
    const rightSwitcher = document.getElementById('labelu_cuboid_right');
    const topSwitcher = document.getElementById('labelu_cuboid_top');
    const target = e.target as HTMLElement;

    if (frontBackSwitcher?.contains(target)) {
      data.direction = data.direction === 'front' ? 'back' : 'front';
    }

    if (leftSwitcher?.contains(target)) {
      data.direction = 'left';
    }

    if (rightSwitcher?.contains(target)) {
      data.direction = 'right';
    }

    if (topSwitcher?.contains(target)) {
      data.direction = 'top';
    }

    this._refresh();

    eventEmitter.emit('change');
  };

  private _refresh() {
    this._connectedLineMapping.clear();
    this._controllerPositionMapping.clear();
    this._edgePositionMapping.clear();
    this._realFrontPolygon = null;
    this.group.clear();
    this._correctData();
    this._setupShapes();
    axis?.rerender();
  }

  private _correctData() {
    const { data } = this;

    const { front, back } = data;

    // 修正前面的坐标
    if (front.tl.x > front.tr.x) {
      const temp = front.tl.x;
      front.tl.x = front.tr.x;
      front.tr.x = temp;
      front.bl.x = front.tl.x;
      front.br.x = front.tr.x;
    }

    // 修正后面的坐标
    if (back.tl.x > back.tr.x) {
      const temp = back.tl.x;
      back.tl.x = back.tr.x;
      back.tr.x = temp;
      back.bl.x = back.tl.x;
      back.br.x = back.tr.x;
    }
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
    const { _controllerPositionMapping, _prevControllerDynamicCoordinates, data } = this;

    _controllerPositionMapping.forEach((point, key) => {
      _prevControllerDynamicCoordinates!.set(key, cloneDeep(point.dynamicCoordinate[0]));
    });
    this._previousDynamicCoordinate = cloneDeep(controllerPoint.dynamicCoordinate);
    this._preBackHeight = axis!.scale * (data.back.bl.y - data.back.tl.y);
    this._preFrontHeight = axis!.scale * (data.front.bl.y - data.front.tl.y);
  };

  /**
   * 移动控制点
   * @param ControllerPoint
   * @description 控制点移动规则
   */
  private _onControllerPointMove = (controllerPoint: ControllerPoint, _e: MouseEvent) => {
    const {
      config,
      _controllerPositionMapping,
      _edgePositionMapping,
      _previousDynamicCoordinate,
      _realFrontPolygon,
      _connectedLineMapping,
      _preBackHeight,
      _preFrontHeight,
      _prevControllerDynamicCoordinates,
    } = this;

    if (!_realFrontPolygon) {
      return;
    }
    const controlFrontTl = _controllerPositionMapping.get('front-tl')!;
    const controlFrontTr = _controllerPositionMapping.get('front-tr')!;
    const controlFrontBr = _controllerPositionMapping.get('front-br')!;
    const controlFrontBl = _controllerPositionMapping.get('front-bl')!;
    const controlBackTl = _controllerPositionMapping.get('back-tl')!;
    const controlBackTr = _controllerPositionMapping.get('back-tr')!;
    const controlBackBr = _controllerPositionMapping.get('back-br')!;
    const controlBackBl = _controllerPositionMapping.get('back-bl')!;
    const edgeFrontTop = _edgePositionMapping.get('front-top')!;
    const edgeFrontRight = _edgePositionMapping.get('front-right')!;
    const edgeFrontBottom = _edgePositionMapping.get('front-bottom')!;
    const edgeFrontLeft = _edgePositionMapping.get('front-left')!;
    const edgeBackTop = _edgePositionMapping.get('back-top')!;
    const edgeBackRight = _edgePositionMapping.get('back-right')!;
    const edgeBackBottom = _edgePositionMapping.get('back-bottom')!;
    const edgeBackLeft = _edgePositionMapping.get('back-left')!;
    const lineTl = _connectedLineMapping.get('tl')!;
    const lineTr = _connectedLineMapping.get('tr')!;
    const lineBr = _connectedLineMapping.get('br')!;
    const lineBl = _connectedLineMapping.get('bl')!;

    // eslint-disable-next-line prefer-const
    let [safeX, safeY] = config.outOfImage ? [true, true] : axis!.isCoordinatesSafe(_previousDynamicCoordinate!);

    const [zPosition, position] = controllerPoint.name!.split('-') as [ZPosition, LinePosition];

    // 控制前面
    let yRatio = 1;
    const { x, y } = controllerPoint.plainCoordinate[0];

    if (zPosition === 'front') {
      if (position === 'tl') {
        yRatio = Math.max(
          1,
          Math.abs(controllerPoint.dynamicCoordinate[0].y - controlFrontBl.dynamicCoordinate[0].y) / _preBackHeight,
        );

        if (safeY) {
          safeY = controllerPoint.coordinate[0].y < controlFrontBl.plainCoordinate[0].y;
        }

        if (safeX) {
          controlFrontBl.coordinate[0].x = x;
          lineTl.coordinate[0].x = x;
          lineBl.coordinate[0].x = x;
          edgeFrontTop.coordinate[0].x = x;
          edgeFrontLeft.coordinate[0].x = x;
          edgeFrontLeft.coordinate[1].x = x;
          edgeFrontBottom.coordinate[1].x = x;
        }

        if (safeY) {
          controlFrontTr.coordinate[0].y = y;
          lineTl.coordinate[0].y = y;
          lineTr.coordinate[0].y = y;
          edgeFrontTop.coordinate[0].y = y;
          edgeFrontTop.coordinate[1].y = y;
          edgeFrontLeft.coordinate[1].y = y;
          edgeFrontRight.coordinate[0].y = y;
        }

        const width = controlFrontTr.dynamicCoordinate[0].x - controllerPoint.dynamicCoordinate[0].x;
        const height = controlFrontBl.dynamicCoordinate[0].y - controllerPoint.dynamicCoordinate[0].y;
        const sizeRatio = width / height;

        // 后面
        if (safeX) {
          // 后面
          const backX = axis!.getOriginalX(
            _prevControllerDynamicCoordinates!.get('back-tr')!.x - (yRatio > 1 ? _preBackHeight : height) * sizeRatio,
          );
          controlBackTl.coordinate[0].x = backX;
          controlBackBl.coordinate[0].x = backX;
          lineTl.coordinate[1].x = backX;
          lineBl.coordinate[1].x = backX;
          edgeBackTop.coordinate[0].x = backX;
          edgeBackLeft.coordinate[0].x = backX;
          edgeBackLeft.coordinate[1].x = backX;
          edgeBackBottom.coordinate[1].x = backX;
        }

        if (safeY) {
          // 后面
          const maxY = axis!.getOriginalY(_prevControllerDynamicCoordinates!.get('back-tr')!.y);
          const currentFrontHeight = Math.abs(
            controlFrontBl.plainCoordinate[0].y - controlFrontTl.plainCoordinate[0].y,
          );

          if (yRatio > 1) {
            controlBackTl.coordinate[0].y = maxY;
            controlBackTr.coordinate[0].y = maxY;
            lineTl.coordinate[1].y = maxY;
            lineTr.coordinate[1].y = maxY;
            edgeBackTop.coordinate[0].y = maxY;
            edgeBackTop.coordinate[1].y = maxY;
            edgeBackLeft.coordinate[1].y = maxY;
            edgeBackRight.coordinate[0].y = maxY;
          } else {
            const backY = edgeBackLeft.plainCoordinate[0].y - currentFrontHeight;

            controlBackTl.coordinate[0].y = backY;
            controlBackTr.coordinate[0].y = backY;
            lineTl.coordinate[1].y = backY;
            lineTr.coordinate[1].y = backY;
            edgeBackTop.coordinate[0].y = backY;
            edgeBackTop.coordinate[1].y = backY;
            edgeBackLeft.coordinate[1].y = backY;
            edgeBackRight.coordinate[0].y = backY;
          }
        }
      }

      if (position === 'tr') {
        yRatio = Math.max(
          1,
          Math.abs(controllerPoint.dynamicCoordinate[0].y - controlFrontBr.dynamicCoordinate[0].y) / _preBackHeight,
        );

        if (safeY) {
          safeY = controllerPoint.coordinate[0].y < controlFrontBr.plainCoordinate[0].y;
        }

        if (safeX) {
          controlFrontBr.coordinate[0].x = x;
          lineTr.coordinate[0].x = x;
          lineBr.coordinate[0].x = x;
          edgeFrontTop.coordinate[1].x = x;
          edgeFrontRight.coordinate[0].x = x;
          edgeFrontRight.coordinate[1].x = x;
          edgeFrontBottom.coordinate[0].x = x;
        }

        if (safeY) {
          controlFrontTl.coordinate[0].y = y;
          lineTl.coordinate[0].y = y;
          lineTr.coordinate[0].y = y;
          edgeFrontTop.coordinate[0].y = y;
          edgeFrontTop.coordinate[1].y = y;
          edgeFrontLeft.coordinate[1].y = y;
          edgeFrontRight.coordinate[0].y = y;
        }

        const width = controllerPoint.dynamicCoordinate[0].x - controlFrontTl.dynamicCoordinate[0].x;
        const height = controlFrontBr.dynamicCoordinate[0].y - controllerPoint.dynamicCoordinate[0].y;
        const sizeRatio = width / height;

        // 后面
        if (safeX) {
          // 后面
          const backX = axis!.getOriginalX(
            _prevControllerDynamicCoordinates!.get('back-tr')!.x - (yRatio > 1 ? _preBackHeight : height) * sizeRatio,
          );
          controlBackTl.coordinate[0].x = backX;
          controlBackBl.coordinate[0].x = backX;
          lineTl.coordinate[1].x = backX;
          lineBl.coordinate[1].x = backX;
          edgeBackTop.coordinate[0].x = backX;
          edgeBackLeft.coordinate[0].x = backX;
          edgeBackLeft.coordinate[1].x = backX;
          edgeBackBottom.coordinate[1].x = backX;
        }

        if (safeY) {
          // 后面
          const maxY = axis!.getOriginalY(_prevControllerDynamicCoordinates!.get('back-tr')!.y);
          const currentFrontHeight = Math.abs(
            controlFrontBr.plainCoordinate[0].y - controlFrontTr.plainCoordinate[0].y,
          );

          if (yRatio > 1) {
            controlBackTl.coordinate[0].y = maxY;
            controlBackTr.coordinate[0].y = maxY;
            lineTl.coordinate[1].y = maxY;
            lineTr.coordinate[1].y = maxY;
            edgeBackTop.coordinate[0].y = maxY;
            edgeBackTop.coordinate[1].y = maxY;
            edgeBackLeft.coordinate[1].y = maxY;
            edgeBackRight.coordinate[0].y = maxY;
          } else {
            const backY = edgeBackLeft.plainCoordinate[0].y - currentFrontHeight;

            controlBackTl.coordinate[0].y = backY;
            controlBackTr.coordinate[0].y = backY;
            lineTl.coordinate[1].y = backY;
            lineTr.coordinate[1].y = backY;
            edgeBackTop.coordinate[0].y = backY;
            edgeBackTop.coordinate[1].y = backY;
            edgeBackLeft.coordinate[1].y = backY;
            edgeBackRight.coordinate[0].y = backY;
          }
        }
      }

      if (position === 'bl') {
        yRatio = Math.max(
          1,
          Math.abs(controllerPoint.dynamicCoordinate[0].y - controlFrontTl.dynamicCoordinate[0].y) / _preBackHeight,
        );

        if (safeY) {
          safeY = controllerPoint.coordinate[0].y > controlBackBl.plainCoordinate[0].y;
        }

        if (safeX) {
          controlFrontTl.coordinate[0].x = x;
          lineTl.coordinate[0].x = x;
          lineBl.coordinate[0].x = x;
          edgeFrontTop.coordinate[0].x = x;
          edgeFrontLeft.coordinate[0].x = x;
          edgeFrontLeft.coordinate[1].x = x;
          edgeFrontBottom.coordinate[1].x = x;
        }

        if (safeY) {
          controlFrontBr.coordinate[0].y = y;
          lineBl.coordinate[0].y = y;
          lineBr.coordinate[0].y = y;
          edgeFrontBottom.coordinate[0].y = y;
          edgeFrontBottom.coordinate[1].y = y;
          edgeFrontLeft.coordinate[0].y = y;
          edgeFrontRight.coordinate[1].y = y;
        }

        const width = Math.abs(controlFrontBr.dynamicCoordinate[0].x - controllerPoint.dynamicCoordinate[0].x);
        const height = Math.abs(controlFrontTl.dynamicCoordinate[0].y - controllerPoint.dynamicCoordinate[0].y);
        const sizeRatio = width / height;

        // 后面
        if (safeX) {
          // 后面
          const backX = axis!.getOriginalX(
            _prevControllerDynamicCoordinates!.get('back-br')!.x - (yRatio > 1 ? _preBackHeight : height) * sizeRatio,
          );
          controlBackTl.coordinate[0].x = backX;
          controlBackBl.coordinate[0].x = backX;
          lineTl.coordinate[1].x = backX;
          lineBl.coordinate[1].x = backX;
          edgeBackTop.coordinate[0].x = backX;
          edgeBackLeft.coordinate[0].x = backX;
          edgeBackLeft.coordinate[1].x = backX;
          edgeBackBottom.coordinate[1].x = backX;
        }

        if (safeY) {
          // 后面
          const maxY = axis!.getOriginalY(_prevControllerDynamicCoordinates!.get('back-tr')!.y);
          const currentFrontHeight = Math.abs(
            controlFrontBl.plainCoordinate[0].y - controlFrontTl.plainCoordinate[0].y,
          );

          if (yRatio > 1) {
            controlBackTl.coordinate[0].y = maxY;
            controlBackTr.coordinate[0].y = maxY;
            lineTl.coordinate[1].y = maxY;
            lineTr.coordinate[1].y = maxY;
            edgeBackTop.coordinate[0].y = maxY;
            edgeBackTop.coordinate[1].y = maxY;
            edgeBackLeft.coordinate[1].y = maxY;
            edgeBackRight.coordinate[0].y = maxY;
          } else {
            const backY = edgeBackLeft.plainCoordinate[0].y - currentFrontHeight;

            controlBackTl.coordinate[0].y = backY;
            controlBackTr.coordinate[0].y = backY;
            lineTl.coordinate[1].y = backY;
            lineTr.coordinate[1].y = backY;
            edgeBackTop.coordinate[0].y = backY;
            edgeBackTop.coordinate[1].y = backY;
            edgeBackLeft.coordinate[1].y = backY;
            edgeBackRight.coordinate[0].y = backY;
          }
        }
      }

      if (position === 'br') {
        yRatio = Math.max(
          1,
          Math.abs(controllerPoint.dynamicCoordinate[0].y - controlFrontTr.dynamicCoordinate[0].y) / _preBackHeight,
        );

        if (safeY) {
          safeY = controllerPoint.coordinate[0].y > controlBackBr.plainCoordinate[0].y;
        }

        if (safeX) {
          controlFrontTr.coordinate[0].x = x;
          lineBr.coordinate[0].x = x;
          lineTr.coordinate[0].x = x;
          edgeFrontTop.coordinate[1].x = x;
          edgeFrontRight.coordinate[0].x = x;
          edgeFrontRight.coordinate[1].x = x;
          edgeFrontBottom.coordinate[0].x = x;
        }

        if (safeY) {
          controlFrontBl.coordinate[0].y = y;
          lineBl.coordinate[0].y = y;
          lineBr.coordinate[0].y = y;
          edgeFrontBottom.coordinate[0].y = y;
          edgeFrontBottom.coordinate[1].y = y;
          edgeFrontLeft.coordinate[0].y = y;
          edgeFrontRight.coordinate[1].y = y;
        }

        const width = Math.abs(controllerPoint.dynamicCoordinate[0].x - controlFrontTl.dynamicCoordinate[0].x);
        const height = Math.abs(controlFrontTr.dynamicCoordinate[0].y - controllerPoint.dynamicCoordinate[0].y);
        const sizeRatio = width / height;

        // 后面
        if (safeX) {
          // 后面
          const backX = axis!.getOriginalX(
            _prevControllerDynamicCoordinates!.get('back-br')!.x - (yRatio > 1 ? _preBackHeight : height) * sizeRatio,
          );
          controlBackTl.coordinate[0].x = backX;
          controlBackBl.coordinate[0].x = backX;
          lineTl.coordinate[1].x = backX;
          lineBl.coordinate[1].x = backX;
          edgeBackTop.coordinate[0].x = backX;
          edgeBackLeft.coordinate[0].x = backX;
          edgeBackLeft.coordinate[1].x = backX;
          edgeBackBottom.coordinate[1].x = backX;
        }

        if (safeY) {
          // 后面
          const maxY = axis!.getOriginalY(_prevControllerDynamicCoordinates!.get('back-tr')!.y);
          const currentFrontHeight = Math.abs(
            controlFrontBr.plainCoordinate[0].y - controlFrontTr.plainCoordinate[0].y,
          );

          if (yRatio > 1) {
            controlBackTl.coordinate[0].y = maxY;
            controlBackTr.coordinate[0].y = maxY;
            lineTl.coordinate[1].y = maxY;
            lineTr.coordinate[1].y = maxY;
            edgeBackTop.coordinate[0].y = maxY;
            edgeBackTop.coordinate[1].y = maxY;
            edgeBackLeft.coordinate[1].y = maxY;
            edgeBackRight.coordinate[0].y = maxY;
          } else {
            const backY = edgeBackLeft.plainCoordinate[0].y - currentFrontHeight;

            controlBackTl.coordinate[0].y = backY;
            controlBackTr.coordinate[0].y = backY;
            lineTl.coordinate[1].y = backY;
            lineTr.coordinate[1].y = backY;
            edgeBackTop.coordinate[0].y = backY;
            edgeBackTop.coordinate[1].y = backY;
            edgeBackLeft.coordinate[1].y = backY;
            edgeBackRight.coordinate[0].y = backY;
          }
        }
      }
    } else {
      // 控制后面
      if (position === 'tl') {
        yRatio = Math.max(
          1,
          Math.abs(controllerPoint.dynamicCoordinate[0].y - edgeBackRight.dynamicCoordinate[1].y) / _preFrontHeight,
        );

        if (safeY) {
          safeY = controllerPoint.coordinate[0].y < controlBackBl.plainCoordinate[0].y;
        }

        if (safeX) {
          controlBackBl.coordinate[0].x = x;
          lineTl.coordinate[1].x = x;
          lineBl.coordinate[1].x = x;
          edgeBackTop.coordinate[0].x = x;
          edgeBackLeft.coordinate[0].x = x;
          edgeBackLeft.coordinate[1].x = x;
          edgeBackBottom.coordinate[1].x = x;
        }

        if (safeY) {
          controlBackTr.coordinate[0].y = y;
          lineTl.coordinate[1].y = y;
          lineTr.coordinate[1].y = y;
          edgeBackTop.coordinate[0].y = y;
          edgeBackTop.coordinate[1].y = y;
          edgeBackLeft.coordinate[1].y = y;
          edgeBackRight.coordinate[0].y = y;
        }

        // 由透视规则更新后方左侧图形
        const width = Math.abs(controlFrontTr.dynamicCoordinate[0].x - controlFrontTl.dynamicCoordinate[0].x);
        const height = Math.abs(controlFrontBr.dynamicCoordinate[0].y - controlFrontTr.dynamicCoordinate[0].y);
        const currentBackHeight = Math.abs(edgeBackRight.plainCoordinate[0].y - edgeBackRight.plainCoordinate[1].y);
        const sizeRatio = width / height;

        const backX = controllerPoint.plainCoordinate[0].x + currentBackHeight * sizeRatio;

        controlBackTr.coordinate[0].x = backX;
        controlBackBr.coordinate[0].x = backX;
        lineTr.coordinate[1].x = backX;
        lineBr.coordinate[1].x = backX;
        edgeBackTop.coordinate[1].x = backX;
        edgeBackRight.coordinate[0].x = backX;
        edgeBackRight.coordinate[1].x = backX;
        edgeBackBottom.coordinate[0].x = backX;

        const minFrontY = axis!.getOriginalY(_prevControllerDynamicCoordinates!.get('front-tl')!.y);

        if (yRatio > 1) {
          const frontY = controlFrontBl.plainCoordinate[0].y - currentBackHeight;

          controlFrontTl.coordinate[0].y = frontY;
          controlFrontTr.coordinate[0].y = frontY;
          lineTl.coordinate[0].y = frontY;
          lineTr.coordinate[0].y = frontY;
          edgeFrontTop.coordinate[0].y = frontY;
          edgeFrontTop.coordinate[1].y = frontY;
          edgeFrontLeft.coordinate[1].y = frontY;
          edgeFrontRight.coordinate[0].y = frontY;
        } else {
          controlFrontTl.coordinate[0].y = minFrontY;
          controlFrontTr.coordinate[0].y = minFrontY;
          lineTl.coordinate[0].y = minFrontY;
          lineTr.coordinate[0].y = minFrontY;
          edgeFrontTop.coordinate[0].y = minFrontY;
          edgeFrontTop.coordinate[1].y = minFrontY;
          edgeFrontLeft.coordinate[1].y = minFrontY;
          edgeFrontRight.coordinate[0].y = minFrontY;
        }
      }

      if (position === 'tr') {
        yRatio = Math.max(
          1,
          Math.abs(controllerPoint.dynamicCoordinate[0].y - edgeBackRight.dynamicCoordinate[1].y) / _preFrontHeight,
        );

        if (safeY) {
          safeY = controllerPoint.coordinate[0].y < controlBackBr.plainCoordinate[0].y;
        }

        if (safeX) {
          controlBackTl.coordinate[0].x = x;
          controlBackBr.coordinate[0].x = x;
          lineTr.coordinate[1].x = x;
          lineBr.coordinate[1].x = x;
          edgeBackTop.coordinate[1].x = x;
          edgeBackRight.coordinate[0].x = x;
          edgeBackRight.coordinate[1].x = x;
          edgeBackBottom.coordinate[0].x = x;
        }

        if (safeY) {
          controlBackTl.coordinate[0].y = y;
          controlBackTr.coordinate[0].y = y;
          lineTl.coordinate[1].y = y;
          lineTr.coordinate[1].y = y;
          edgeBackTop.coordinate[0].y = y;
          edgeBackTop.coordinate[1].y = y;
          edgeBackLeft.coordinate[1].y = y;
          edgeBackRight.coordinate[0].y = y;
        }

        // 由透视规则更新后方左侧图形
        const width = Math.abs(controlFrontTr.dynamicCoordinate[0].x - controlFrontTl.dynamicCoordinate[0].x);
        const height = Math.abs(controlFrontBr.dynamicCoordinate[0].y - controlFrontTr.dynamicCoordinate[0].y);
        const currentBackHeight = Math.abs(edgeBackRight.plainCoordinate[0].y - edgeBackRight.plainCoordinate[1].y);
        const sizeRatio = width / height;

        const backX = controllerPoint.plainCoordinate[0].x - currentBackHeight * sizeRatio;

        controlBackTl.coordinate[0].x = backX;
        controlBackBl.coordinate[0].x = backX;
        lineTl.coordinate[1].x = backX;
        lineBl.coordinate[1].x = backX;
        edgeBackTop.coordinate[0].x = backX;
        edgeBackLeft.coordinate[0].x = backX;
        edgeBackLeft.coordinate[1].x = backX;
        edgeBackBottom.coordinate[1].x = backX;

        const minFrontY = axis!.getOriginalY(_prevControllerDynamicCoordinates!.get('front-tl')!.y);

        if (yRatio > 1) {
          const frontY = controlFrontBl.plainCoordinate[0].y - currentBackHeight;

          controlFrontTl.coordinate[0].y = frontY;
          controlFrontTr.coordinate[0].y = frontY;
          lineTl.coordinate[0].y = frontY;
          lineTr.coordinate[0].y = frontY;
          edgeFrontTop.coordinate[0].y = frontY;
          edgeFrontTop.coordinate[1].y = frontY;
          edgeFrontLeft.coordinate[1].y = frontY;
          edgeFrontRight.coordinate[0].y = frontY;
        } else {
          controlFrontTl.coordinate[0].y = minFrontY;
          controlFrontTr.coordinate[0].y = minFrontY;
          lineTl.coordinate[0].y = minFrontY;
          lineTr.coordinate[0].y = minFrontY;
          edgeFrontTop.coordinate[0].y = minFrontY;
          edgeFrontTop.coordinate[1].y = minFrontY;
          edgeFrontLeft.coordinate[1].y = minFrontY;
          edgeFrontRight.coordinate[0].y = minFrontY;
        }
      }

      if (position === 'bl') {
        yRatio = Math.max(
          1,
          Math.abs(controllerPoint.dynamicCoordinate[0].y - edgeBackRight.dynamicCoordinate[0].y) / _preFrontHeight,
        );

        if (safeY) {
          safeY =
            controllerPoint.coordinate[0].y > controlBackTr.plainCoordinate[0].y &&
            controllerPoint.coordinate[0].y < controlFrontBl.plainCoordinate[0].y;
        }

        if (safeX) {
          controlBackTl.coordinate[0].x = x;
          lineTl.coordinate[1].x = x;
          lineBl.coordinate[1].x = x;
          edgeBackTop.coordinate[0].x = x;
          edgeBackLeft.coordinate[0].x = x;
          edgeBackLeft.coordinate[1].x = x;
          edgeBackBottom.coordinate[1].x = x;
        }

        if (safeY) {
          controlBackBr.coordinate[0].y = y;
          lineBl.coordinate[1].y = y;
          lineBr.coordinate[1].y = y;
          edgeBackBottom.coordinate[0].y = y;
          edgeBackBottom.coordinate[1].y = y;
          edgeBackLeft.coordinate[0].y = y;
          edgeBackRight.coordinate[1].y = y;
        }

        // 由透视规则更新后方左侧图形
        const width = Math.abs(controlFrontTr.dynamicCoordinate[0].x - controlFrontTl.dynamicCoordinate[0].x);
        const height = Math.abs(controlFrontBr.dynamicCoordinate[0].y - controlFrontTr.dynamicCoordinate[0].y);
        const currentBackHeight = Math.abs(edgeBackRight.plainCoordinate[0].y - edgeBackRight.plainCoordinate[1].y);
        const sizeRatio = width / height;

        const backX = controllerPoint.plainCoordinate[0].x + currentBackHeight * sizeRatio;

        controlBackTr.coordinate[0].x = backX;
        controlBackBr.coordinate[0].x = backX;
        lineTr.coordinate[1].x = backX;
        lineBr.coordinate[1].x = backX;
        edgeBackTop.coordinate[1].x = backX;
        edgeBackRight.coordinate[0].x = backX;
        edgeBackRight.coordinate[1].x = backX;
        edgeBackBottom.coordinate[0].x = backX;

        const minFrontY = axis!.getOriginalY(_prevControllerDynamicCoordinates!.get('front-tl')!.y);

        if (yRatio > 1) {
          const frontY = controlFrontBl.plainCoordinate[0].y - currentBackHeight;

          controlFrontTl.coordinate[0].y = frontY;
          controlFrontTr.coordinate[0].y = frontY;
          lineTl.coordinate[0].y = frontY;
          lineTr.coordinate[0].y = frontY;
          edgeFrontTop.coordinate[0].y = frontY;
          edgeFrontTop.coordinate[1].y = frontY;
          edgeFrontLeft.coordinate[1].y = frontY;
          edgeFrontRight.coordinate[0].y = frontY;
        } else {
          controlFrontTl.coordinate[0].y = minFrontY;
          controlFrontTr.coordinate[0].y = minFrontY;
          lineTl.coordinate[0].y = minFrontY;
          lineTr.coordinate[0].y = minFrontY;
          edgeFrontTop.coordinate[0].y = minFrontY;
          edgeFrontTop.coordinate[1].y = minFrontY;
          edgeFrontLeft.coordinate[1].y = minFrontY;
          edgeFrontRight.coordinate[0].y = minFrontY;
        }
      }

      if (position === 'br') {
        yRatio = Math.max(
          1,
          Math.abs(controllerPoint.dynamicCoordinate[0].y - edgeBackRight.dynamicCoordinate[0].y) / _preFrontHeight,
        );

        if (safeY) {
          safeY =
            controllerPoint.coordinate[0].y > controlBackTr.plainCoordinate[0].y &&
            controllerPoint.coordinate[0].y < controlFrontBr.plainCoordinate[0].y;
        }

        if (safeX) {
          controlBackTr.coordinate[0].x = x;
          lineTr.coordinate[1].x = x;
          lineBr.coordinate[1].x = x;
          edgeBackTop.coordinate[1].x = x;
          edgeBackRight.coordinate[0].x = x;
          edgeBackRight.coordinate[1].x = x;
          edgeBackBottom.coordinate[0].x = x;
        }

        if (safeY) {
          controlBackBl.coordinate[0].y = y;
          lineBl.coordinate[1].y = y;
          lineBr.coordinate[1].y = y;
          edgeBackBottom.coordinate[0].y = y;
          edgeBackBottom.coordinate[1].y = y;
          edgeBackLeft.coordinate[0].y = y;
          edgeBackRight.coordinate[1].y = y;
        }

        // 由透视规则更新后方左侧图形
        const width = Math.abs(controlFrontTr.dynamicCoordinate[0].x - controlFrontTl.dynamicCoordinate[0].x);
        const height = Math.abs(controlFrontBr.dynamicCoordinate[0].y - controlFrontTr.dynamicCoordinate[0].y);
        const currentBackHeight = Math.abs(edgeBackRight.plainCoordinate[0].y - edgeBackRight.plainCoordinate[1].y);
        const sizeRatio = width / height;

        const backX = controllerPoint.plainCoordinate[0].x - currentBackHeight * sizeRatio;

        controlBackTl.coordinate[0].x = backX;
        controlBackBl.coordinate[0].x = backX;
        lineTl.coordinate[1].x = backX;
        lineBl.coordinate[1].x = backX;
        edgeBackTop.coordinate[0].x = backX;
        edgeBackLeft.coordinate[0].x = backX;
        edgeBackLeft.coordinate[1].x = backX;
        edgeBackBottom.coordinate[1].x = backX;

        const minFrontY = axis!.getOriginalY(_prevControllerDynamicCoordinates!.get('front-tl')!.y);

        if (yRatio > 1) {
          const frontY = controlFrontBl.plainCoordinate[0].y - currentBackHeight;

          controlFrontTl.coordinate[0].y = frontY;
          controlFrontTr.coordinate[0].y = frontY;
          lineTl.coordinate[0].y = frontY;
          lineTr.coordinate[0].y = frontY;
          edgeFrontTop.coordinate[0].y = frontY;
          edgeFrontTop.coordinate[1].y = frontY;
          edgeFrontLeft.coordinate[1].y = frontY;
          edgeFrontRight.coordinate[0].y = frontY;
        } else {
          controlFrontTl.coordinate[0].y = minFrontY;
          controlFrontTr.coordinate[0].y = minFrontY;
          lineTl.coordinate[0].y = minFrontY;
          lineTr.coordinate[0].y = minFrontY;
          edgeFrontTop.coordinate[0].y = minFrontY;
          edgeFrontTop.coordinate[1].y = minFrontY;
          edgeFrontLeft.coordinate[1].y = minFrontY;
          edgeFrontRight.coordinate[0].y = minFrontY;
        }
      }
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
  };

  /**
   * 释放控制点
   */
  private _onControllerPointUp = () => {
    this._prevControllerDynamicCoordinates.clear();
    this._previousDynamicCoordinate = null;
    // 手动更新组合的包围盒
    this.group.update();
    // 控制点松开后会触发事件，在事件执行完后再刷新图形
    setTimeout(() => {
      this._refresh();
    });
  };

  // ========================== 控制边 ==========================

  private _onEdgeDown = (_e: MouseEvent, edge: ControllerEdge) => {
    const { _controllerPositionMapping, _prevControllerDynamicCoordinates, data } = this;

    _controllerPositionMapping.forEach((point, key) => {
      _prevControllerDynamicCoordinates!.set(key, cloneDeep(point.dynamicCoordinate[0]));
    });

    this._previousDynamicCoordinate = cloneDeep(edge.dynamicCoordinate);
    this._preBackHeight = axis!.scale * (data.back.bl.y - data.back.tl.y);
    this._preFrontHeight = axis!.scale * (data.front.bl.y - data.front.tl.y);
  };

  /**
   * 控制边的移动
   */
  private _onEdgeMove = (_e: MouseEvent, edge: ControllerEdge) => {
    const {
      _controllerPositionMapping,
      _edgePositionMapping,
      _connectedLineMapping,
      _prevControllerDynamicCoordinates,
      _preBackHeight,
      config,
    } = this;

    const controlFrontTl = _controllerPositionMapping.get('front-tl')!;
    const controlFrontTr = _controllerPositionMapping.get('front-tr')!;
    const controlFrontBr = _controllerPositionMapping.get('front-br')!;
    const controlFrontBl = _controllerPositionMapping.get('front-bl')!;
    const controlBackTr = _controllerPositionMapping.get('back-tr')!;
    const controlBackBr = _controllerPositionMapping.get('back-br')!;
    const controlBackTl = _controllerPositionMapping.get('back-tl')!;
    const controlBackBl = _controllerPositionMapping.get('back-bl')!;
    const edgeFrontTop = _edgePositionMapping.get('front-top')!;
    const edgeFrontRight = _edgePositionMapping.get('front-right')!;
    const edgeFrontBottom = _edgePositionMapping.get('front-bottom')!;
    const edgeFrontLeft = _edgePositionMapping.get('front-left')!;
    const edgeBackTop = _edgePositionMapping.get('back-top')!;
    const edgeBackRight = _edgePositionMapping.get('back-right')!;
    const edgeBackBottom = _edgePositionMapping.get('back-bottom')!;
    const edgeBackLeft = _edgePositionMapping.get('back-left')!;
    const lineTl = _connectedLineMapping.get('tl')!;
    const lineTr = _connectedLineMapping.get('tr')!;
    const lineBr = _connectedLineMapping.get('br')!;
    const lineBl = _connectedLineMapping.get('bl')!;

    const x = axis!.getOriginalX(edge.previousDynamicCoordinate![0].x + axis!.distance.x);
    const y = axis!.getOriginalY(edge.previousDynamicCoordinate![0].y + axis!.distance.y);

    // eslint-disable-next-line prefer-const
    let [safeX, safeY] = config.outOfImage ? [true, true] : axis!.isCoordinatesSafe(edge.previousDynamicCoordinate!);

    const [zPosition, position] = edge.name!.split('-') as [ZPosition, SimpleEdgePosition];

    if (safeX && (position === 'left' || position === 'right')) {
      edge.coordinate[0].x = x;
      edge.coordinate[1].x = x;
    }

    if (safeY && (position === 'top' || position === 'bottom')) {
      edge.coordinate[0].y = y;
      edge.coordinate[1].y = y;
    }

    let yRatio = 1;

    if (zPosition === 'front') {
      if (position === 'top') {
        yRatio = Math.max(
          1,
          Math.abs(edge.dynamicCoordinate[0].y - edgeFrontBottom.dynamicCoordinate[0].y) / _preBackHeight,
        );

        if (safeY) {
          safeY = edge.coordinate[0].y < controlFrontBr.plainCoordinate[0].y;
        }

        const width = Math.abs(edge.dynamicCoordinate[0].x - edge.dynamicCoordinate[1].x);
        const height = Math.abs(edgeFrontBottom.dynamicCoordinate[0].y - edge.dynamicCoordinate[0].y);
        const sizeRatio = width / height;

        if (safeY) {
          controlFrontTl.coordinate[0].y = y;
          controlFrontTr.coordinate[0].y = y;
          lineTl.coordinate[0].y = y;
          lineTr.coordinate[0].y = y;
          edgeFrontLeft.coordinate[1].y = y;
          edgeFrontRight.coordinate[0].y = y;
        }

        // 后面
        if (safeX) {
          const backX = axis!.getOriginalX(
            _prevControllerDynamicCoordinates!.get('back-tr')!.x - (yRatio > 1 ? _preBackHeight : height) * sizeRatio,
          );
          controlBackTl.coordinate[0].x = backX;
          controlBackBl.coordinate[0].x = backX;
          lineTl.coordinate[1].x = backX;
          lineBl.coordinate[1].x = backX;
          edgeBackTop.coordinate[0].x = backX;
          edgeBackLeft.coordinate[0].x = backX;
          edgeBackLeft.coordinate[1].x = backX;
          edgeBackBottom.coordinate[1].x = backX;
        }

        if (safeY) {
          const maxY = axis!.getOriginalY(_prevControllerDynamicCoordinates!.get('back-tr')!.y);
          const currentFrontHeight = Math.abs(
            controlFrontBl.plainCoordinate[0].y - controlFrontTl.plainCoordinate[0].y,
          );

          if (yRatio > 1) {
            controlBackTl.coordinate[0].y = maxY;
            controlBackTr.coordinate[0].y = maxY;
            lineTl.coordinate[1].y = maxY;
            lineTr.coordinate[1].y = maxY;
            edgeBackTop.coordinate[0].y = maxY;
            edgeBackTop.coordinate[1].y = maxY;
            edgeBackLeft.coordinate[1].y = maxY;
            edgeBackRight.coordinate[0].y = maxY;
          } else {
            const backY = edgeBackLeft.plainCoordinate[0].y - currentFrontHeight;

            controlBackTl.coordinate[0].y = backY;
            controlBackTr.coordinate[0].y = backY;
            lineTl.coordinate[1].y = backY;
            lineTr.coordinate[1].y = backY;
            edgeBackTop.coordinate[0].y = backY;
            edgeBackTop.coordinate[1].y = backY;
            edgeBackLeft.coordinate[1].y = backY;
            edgeBackRight.coordinate[0].y = backY;
          }
        }
      }

      if (position === 'right') {
        yRatio = Math.max(1, Math.abs(edge.dynamicCoordinate[0].y - edge.dynamicCoordinate[1].y) / _preBackHeight);
        const width = Math.abs(edge.dynamicCoordinate[0].x - edgeFrontLeft.dynamicCoordinate[1].x);
        const height = Math.abs(edge.dynamicCoordinate[0].y - edge.dynamicCoordinate[1].y);
        const sizeRatio = width / height;

        if (safeX) {
          controlFrontBr.coordinate[0].x = x;
          controlFrontTr.coordinate[0].x = x;
          lineTr.coordinate[0].x = x;
          lineBr.coordinate[0].x = x;
          edgeFrontTop.coordinate[1].x = x;
          edgeFrontBottom.coordinate[0].x = x;
        }

        // 后面
        if (safeX) {
          const backX = axis!.getOriginalX(
            _prevControllerDynamicCoordinates!.get('back-tr')!.x - (yRatio > 1 ? _preBackHeight : height) * sizeRatio,
          );
          controlBackTl.coordinate[0].x = backX;
          controlBackBl.coordinate[0].x = backX;
          lineTl.coordinate[1].x = backX;
          lineBl.coordinate[1].x = backX;
          edgeBackTop.coordinate[0].x = backX;
          edgeBackLeft.coordinate[0].x = backX;
          edgeBackLeft.coordinate[1].x = backX;
          edgeBackBottom.coordinate[1].x = backX;
        }
      }

      if (position === 'bottom') {
        yRatio = Math.max(
          1,
          Math.abs(edge.dynamicCoordinate[0].y - edgeFrontTop.dynamicCoordinate[0].y) / _preBackHeight,
        );

        if (safeY) {
          safeY = edge.coordinate[0].y > controlBackBr.plainCoordinate[0].y;
        }

        const width = Math.abs(edge.dynamicCoordinate[0].x - edge.dynamicCoordinate[1].x);
        const height = Math.abs(edgeFrontTop.dynamicCoordinate[0].y - edge.dynamicCoordinate[0].y);
        const sizeRatio = width / height;

        if (safeY) {
          controlFrontBl.coordinate[0].y = y;
          controlFrontBr.coordinate[0].y = y;
          lineBl.coordinate[0].y = y;
          lineBr.coordinate[0].y = y;
          edgeFrontLeft.coordinate[0].y = y;
          edgeFrontRight.coordinate[1].y = y;
        }

        // 后面
        if (safeX) {
          const backX = axis!.getOriginalX(
            _prevControllerDynamicCoordinates!.get('back-tr')!.x - (yRatio > 1 ? _preBackHeight : height) * sizeRatio,
          );

          controlBackTl.coordinate[0].x = backX;
          controlBackBl.coordinate[0].x = backX;
          lineTl.coordinate[1].x = backX;
          lineBl.coordinate[1].x = backX;
          edgeBackTop.coordinate[0].x = backX;
          edgeBackLeft.coordinate[0].x = backX;
          edgeBackLeft.coordinate[1].x = backX;
          edgeBackBottom.coordinate[1].x = backX;
        }

        if (safeY) {
          const maxY = axis!.getOriginalY(_prevControllerDynamicCoordinates!.get('back-tr')!.y);
          const currentFrontHeight = Math.abs(
            controlFrontBl.plainCoordinate[0].y - controlFrontTl.plainCoordinate[0].y,
          );

          if (yRatio > 1) {
            controlBackTl.coordinate[0].y = maxY;
            controlBackTr.coordinate[0].y = maxY;
            lineTl.coordinate[1].y = maxY;
            lineTr.coordinate[1].y = maxY;
            edgeBackTop.coordinate[0].y = maxY;
            edgeBackTop.coordinate[1].y = maxY;
            edgeBackLeft.coordinate[1].y = maxY;
            edgeBackRight.coordinate[0].y = maxY;
          } else {
            const backY = edgeBackLeft.plainCoordinate[0].y - currentFrontHeight;

            controlBackTl.coordinate[0].y = backY;
            controlBackTr.coordinate[0].y = backY;
            lineTl.coordinate[1].y = backY;
            lineTr.coordinate[1].y = backY;
            edgeBackTop.coordinate[0].y = backY;
            edgeBackTop.coordinate[1].y = backY;
            edgeBackLeft.coordinate[1].y = backY;
            edgeBackRight.coordinate[0].y = backY;
          }
        }
      }

      if (position === 'left') {
        yRatio = Math.max(1, Math.abs(edge.dynamicCoordinate[0].y - edge.dynamicCoordinate[1].y) / _preBackHeight);
        const width = Math.abs(edge.dynamicCoordinate[0].x - edgeFrontRight.dynamicCoordinate[0].x);
        const height = Math.abs(edge.dynamicCoordinate[0].y - edge.dynamicCoordinate[1].y);
        const sizeRatio = width / height;

        if (safeX) {
          controlFrontBl.coordinate[0].x = x;
          controlFrontTl.coordinate[0].x = x;
          lineTl.coordinate[0].x = x;
          lineBl.coordinate[0].x = x;
          edgeFrontTop.coordinate[0].x = x;
          edgeFrontBottom.coordinate[1].x = x;
        }

        // 后面
        if (safeX) {
          const backX = axis!.getOriginalX(
            _prevControllerDynamicCoordinates!.get('back-tr')!.x - (yRatio > 1 ? _preBackHeight : height) * sizeRatio,
          );
          controlBackTl.coordinate[0].x = backX;
          controlBackBl.coordinate[0].x = backX;
          lineTl.coordinate[1].x = backX;
          lineBl.coordinate[1].x = backX;
          edgeBackTop.coordinate[0].x = backX;
          edgeBackLeft.coordinate[0].x = backX;
          edgeBackLeft.coordinate[1].x = backX;
          edgeBackBottom.coordinate[1].x = backX;
        }
      }
    } else {
      if (position === 'right') {
        if (safeX) {
          controlBackTr.coordinate[0].x = x;
          controlBackTl.coordinate[0].x = x;
          controlBackBr.coordinate[0].x = x;
          lineTr.coordinate[1].x = x;
          lineBr.coordinate[1].x = x;
          edgeBackTop.coordinate[1].x = x;
          edgeBackRight.coordinate[0].x = x;
          edgeBackRight.coordinate[1].x = x;
          edgeBackBottom.coordinate[0].x = x;
        }

        // 由透视规则更新后方左侧图形
        const width = Math.abs(controlFrontTr.dynamicCoordinate[0].x - controlFrontTl.dynamicCoordinate[0].x);
        const height = Math.abs(controlFrontBr.dynamicCoordinate[0].y - controlFrontTr.dynamicCoordinate[0].y);
        const currentBackHeight = Math.abs(edgeBackRight.plainCoordinate[0].y - edgeBackRight.plainCoordinate[1].y);
        const sizeRatio = width / height;

        const backX = edge.plainCoordinate[1].x - currentBackHeight * sizeRatio;

        controlBackTl.coordinate[0].x = backX;
        controlBackBl.coordinate[0].x = backX;
        lineTl.coordinate[1].x = backX;
        lineBl.coordinate[1].x = backX;
        edgeBackTop.coordinate[0].x = backX;
        edgeBackLeft.coordinate[0].x = backX;
        edgeBackLeft.coordinate[1].x = backX;
        edgeBackBottom.coordinate[1].x = backX;
      }

      if (position === 'left') {
        if (safeX) {
          controlBackTl.coordinate[0].x = x;
          controlBackBl.coordinate[0].x = x;
          lineTl.coordinate[1].x = x;
          lineBl.coordinate[1].x = x;
          edgeBackTop.coordinate[0].x = x;
          edgeBackLeft.coordinate[0].x = x;
          edgeBackLeft.coordinate[1].x = x;
          edgeBackBottom.coordinate[1].x = x;
        }

        // 由透视规则更新后方左侧图形
        const width = Math.abs(controlFrontTr.dynamicCoordinate[0].x - controlFrontTl.dynamicCoordinate[0].x);
        const height = Math.abs(controlFrontBr.dynamicCoordinate[0].y - controlFrontTr.dynamicCoordinate[0].y);
        const currentBackHeight = Math.abs(edgeBackRight.plainCoordinate[0].y - edgeBackRight.plainCoordinate[1].y);
        const sizeRatio = width / height;

        const backX = edge.plainCoordinate[1].x + currentBackHeight * sizeRatio;

        controlBackTr.coordinate[0].x = backX;
        controlBackBr.coordinate[0].x = backX;
        lineTr.coordinate[1].x = backX;
        lineBr.coordinate[1].x = backX;
        edgeBackTop.coordinate[1].x = backX;
        edgeBackRight.coordinate[0].x = backX;
        edgeBackRight.coordinate[1].x = backX;
        edgeBackBottom.coordinate[0].x = backX;
      }
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

    this.group.update();
  };

  private _onEdgeUp = () => {
    this._prevControllerDynamicCoordinates.clear();
    this._previousDynamicCoordinate = null;
    // 手动更新组合的包围盒
    this.group.update();
    // 控制点松开后会触发事件，在事件执行完后再刷新图形
    setTimeout(() => {
      this._refresh();
    });
  };

  protected getDynamicCoordinates() {
    return this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  public syncCoordToData() {
    const { data, _edgePositionMapping } = this;

    const edgeFrontTop = _edgePositionMapping.get('front-top')!;
    const edgeFrontBottom = _edgePositionMapping.get('front-bottom')!;
    const edgeBackTop = _edgePositionMapping.get('back-top')!;
    const edgeBackBottom = _edgePositionMapping.get('back-bottom')!;

    data.front.tl.x = edgeFrontTop.plainCoordinate[0].x;
    data.front.tl.y = edgeFrontTop.plainCoordinate[0].y;
    data.front.tr.x = edgeFrontTop.plainCoordinate[1].x;
    data.front.tr.y = edgeFrontTop.plainCoordinate[1].y;
    data.front.bl.x = edgeFrontBottom.plainCoordinate[1].x;
    data.front.bl.y = edgeFrontBottom.plainCoordinate[1].y;
    data.front.br.x = edgeFrontBottom.plainCoordinate[0].x;
    data.front.br.y = edgeFrontBottom.plainCoordinate[0].y;

    data.back.tl.x = edgeBackTop.plainCoordinate[0].x;
    data.back.tl.y = edgeBackTop.plainCoordinate[0].y;
    data.back.tr.x = edgeBackTop.plainCoordinate[1].x;
    data.back.tr.y = edgeBackTop.plainCoordinate[1].y;
    data.back.bl.x = edgeBackBottom.plainCoordinate[1].x;
    data.back.bl.y = edgeBackBottom.plainCoordinate[1].y;
    data.back.br.x = edgeBackBottom.plainCoordinate[0].x;
    data.back.br.y = edgeBackBottom.plainCoordinate[0].y;
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

  public destroy(): void {
    super.destroy();
    this._dom?.destroy();
  }
}
