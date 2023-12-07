import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import { AnnotationPolygon } from '../annotation';
import type { AxisPoint, PointStyle, PolygonStyle } from '../shapes';
import { Rect, Point, Polygon } from '../shapes';
import { axis, eventEmitter, monitor } from '../singletons';
import type { AnnotationParams } from '../annotation/Annotation';
import { Annotation } from '../annotation/Annotation';
import { EInternalEvent } from '../enums';
import { Group } from '../shapes/Group';
import type { PolygonData } from '../annotation/Polygon.annotation';

class DraftPolygon extends Annotation<PolygonData, Polygon | Point, PolygonStyle | PointStyle> {
  public controllers: Group<Point, PointStyle> | null = null;
  constructor(params: AnnotationParams<PolygonData, PolygonStyle>) {
    super(params);

    this._setupShapes();
  }

  public destroy(): void {
    super.destroy();

    this.controllers?.destroy();
  }

  public render(_ctx: CanvasRenderingContext2D): void {
    super.render(_ctx);

    this.controllers?.render(_ctx);
  }

  private _setupShapes() {
    const { data, group, style } = this;

    this.controllers = new Group(uuid(), monitor!.getMaxOrder() + 1);

    group.add(
      new Polygon({
        id: data.id,
        coordinate: cloneDeep(data.pointList),
        style,
      }),
    );

    // 点要覆盖在线上
    for (let i = 0; i < data.pointList.length; i++) {
      const pointItem = data.pointList[i];
      const point = new Point({
        id: uuid(),
        // 深拷贝，避免出现引用问题
        coordinate: cloneDeep(pointItem),
        style: { ...style, radius: 8, stroke: 'transparent', fill: 'blue' },
        groupIgnoreRadius: true,
      });

      this.controllers!.add(point);
    }
  }

  public syncCoordToData() {
    const { group, data } = this;
    const polygonCoordinate = group.shapes[0].dynamicCoordinate;

    for (let i = 0; i < polygonCoordinate.length; i++) {
      data.pointList[i].x = axis!.getOriginalX(polygonCoordinate[i].x);
      data.pointList[i].y = axis!.getOriginalY(polygonCoordinate[i].y);
    }
  }
}

export interface PolygonToolOptions extends BasicToolParams<PolygonData, PolygonStyle> {
  /**
   * 线条类型
   * @description
   * - line: 直线
   * - curve: 曲线
   * @default 'line'
   */
  lineType?: 'line' | 'curve';

  /**
   * 边缘吸附
   * @default true;
   */
  edgeAdsorptive?: boolean;

  /**
   * 画布外标注
   * @default true;
   */
  outOfCanvas?: boolean;

  /**
   * 闭合点个数
   * @description 至少两个点
   * @default 2
   */
  closingPointAmount?: number;
}

// @MouseDecorator
export class PolygonTool extends Tool<PolygonData, PolygonStyle, PolygonToolOptions> {
  private _selectionShape: Rect | null = null;

  /**
   * 选中选框
   */
  private _isShapePicked: boolean = false;

  /**
   * 选中端点
   */
  private _selectedPoint: [Point, number] | null = null;

  private _previousPointCoordinate: AxisPoint | null = null;

  private _previousPolygonCoordinates: AxisPoint[] = [];

  public draft: DraftPolygon | null = null;

  private _creatingShapes: Group<Polygon, PolygonStyle> | null = null;

  constructor(params: PolygonToolOptions) {
    super({
      name: 'polygon',
      lineType: 'line',
      edgeAdsorptive: true,
      outOfCanvas: true,
      closingPointAmount: 2,
      labels: [],
      hoveredStyle: {},
      selectedStyle: {},
      // ----------------
      data: [],
      ...params,
      style: {
        ...Polygon.DEFAULT_STYLE,
        ...params.style,
      },
    });

    this._init();

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleMouseUp);
    eventEmitter.on(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }

  /**
   * 点击画布事件处理
   *
   * @description
   * 点击标注时：
   * 1. 销毁被点击的标注的drawing（成品）
   * 2. 进入pen的编辑模式
   *  2.1. 创建新的drawing（成品），需要包含点、线
   *  2.2. 创建选中包围盒
   */
  protected onSelect = (_e: MouseEvent, annotation: AnnotationPolygon) => {
    this?._creatingShapes?.destroy();
    this._creatingShapes = null;
    this.activate(annotation.data.label);
    eventEmitter.emit(EInternalEvent.ToolChange, this.name, annotation.data.label);
    this._archiveDraft();
    this._createDraft(annotation.data);
    // 2. 销毁成品
    this.removeFromDrawing(annotation.id);

    // 3. 记录选中前的坐标
    this._previousPolygonCoordinates = this.getPolygonCoordinates();

    // 重新渲染
    axis!.rerender();
  };

  protected onUnSelect = (_e: MouseEvent) => {
    this._archiveDraft();
    this._destroySelection();
    this?._creatingShapes?.destroy();
    this._creatingShapes = null;
    // 重新渲染
    axis!.rerender();
  };

  private _init() {
    const { data = [] } = this;

    for (const annotation of data) {
      this._addAnnotation(annotation);
    }
  }

  private _addAnnotation(data: PolygonData) {
    const { style, hoveredStyle, drawing } = this;

    drawing!.set(
      data.id,
      new AnnotationPolygon({
        id: data.id,
        data,
        style: { ...style, stroke: this.getLabelColor(data.label) },
        hoveredStyle,
        onSelect: this.onSelect,
      }),
    );
  }

  protected handlePointStyle = () => {
    const { draft } = this;

    if (!draft) {
      return;
    }

    draft.group.each((shape) => {
      if (shape instanceof Point) {
        shape.updateStyle({
          stroke: 'transparent',
        });
      }
    });
  };

  private _createDraft(data: PolygonData) {
    const { style } = this;

    this.draft = new DraftPolygon({
      id: data.id,
      data,
      style: { ...style, stroke: this.getLabelColor(data.label) },
      // 在草稿上添加取消选中的事件监听
      onUnSelect: this.onUnSelect,
      onBBoxOut: this.handlePointStyle,
      onBBoxOver: this.handlePointStyle,
    });
  }

  private _destroySelection() {
    if (this._selectionShape) {
      this._selectionShape.destroy();
      this._selectionShape = null;
    }
  }

  private _archiveDraft() {
    const { draft } = this;

    if (draft) {
      this._addAnnotation(draft.data);
      draft.destroy();
      this._destroySelection();
      this.draft = null;
    }
  }

  private _createSelection() {
    if (this._selectionShape) {
      this._selectionShape.destroy();
    }

    const { draft } = this;
    const bbox = draft!.group.bbox;

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

  private _handleMouseDown = (e: MouseEvent) => {
    const { draft, _creatingShapes } = this;

    if (draft && !_creatingShapes) {
      // ====================== 点击点 ======================
      let selectedPoint = null;
      draft.controllers!.each((shape, index) => {
        if (shape.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
          selectedPoint = [shape, index];
          this._previousPointCoordinate = {
            x: shape.dynamicCoordinate[0].x,
            y: shape.dynamicCoordinate[0].y,
          };

          return false;
        }
      });

      // 选中点后不继续执行
      if (selectedPoint) {
        this._selectedPoint = selectedPoint;
        return;
      }

      // 选中多边形
      if (draft.group.isShapesUnderCursor({ x: e.offsetX, y: e.offsetY })) {
        this._isShapePicked = true;
        this._previousPolygonCoordinates = this.getPolygonCoordinates();

        return;
      }
    }

    // ====================== 绘制 ======================
    const { activeLabel, style } = this;

    if (!activeLabel) {
      return;
    }

    // 先归档上一次的草稿
    this._archiveDraft();

    if (!_creatingShapes) {
      this._creatingShapes = new Group(uuid(), monitor!.getMaxOrder() + 1);
    }

    const startPoint = axis!.getOriginalCoord({
      x: e.offsetX - axis!.distance.x,
      y: e.offsetY - axis!.distance.y,
    });

    console.log('startPoint', startPoint, style);
    // TODO: 创建新多边形
  };

  private _handleMouseMove = (e: MouseEvent) => {
    const {
      draft,
      _previousPolygonCoordinates,
      _isShapePicked,
      _selectedPoint,
      _previousPointCoordinate,
      _creatingShapes,
    } = this;

    if (draft && _selectedPoint && _previousPointCoordinate) {
      this._destroySelection();
      _selectedPoint[0].coordinate = [
        axis!.getOriginalCoord({
          x: e.offsetX,
          y: e.offsetY,
        }),
      ];

      draft.group.shapes[0].coordinate[_selectedPoint[1]] = _selectedPoint[0].coordinate[0];

      // 手动更新组合的包围盒
      draft.group.update();

      draft.syncCoordToData();
    } else if (draft && _isShapePicked) {
      this._destroySelection();
      // 更新草稿坐标
      draft.group.shapes[0].coordinate.forEach((point, index) => {
        point.x = axis!.getOriginalX(_previousPolygonCoordinates[index].x + axis!.distance.x);
        point.y = axis!.getOriginalY(_previousPolygonCoordinates[index].y + axis!.distance.y);
      });

      draft.controllers!.each((shape, index) => {
        shape.coordinate[0].x = axis!.getOriginalX(_previousPolygonCoordinates[index].x + axis!.distance.x);
        shape.coordinate[0].y = axis!.getOriginalY(_previousPolygonCoordinates[index].y + axis!.distance.y);
      });

      // 手动更新组合的包围盒
      draft.group.update();

      draft.syncCoordToData();
    } else if (_creatingShapes) {
      // 正在绘制的线段，最后一个端点的坐标跟随鼠标
      const { shapes } = _creatingShapes;
      const lastShape = shapes[shapes.length - 1];
      lastShape.coordinate[1].x = axis!.getOriginalX(e.offsetX);
      lastShape.coordinate[1].y = axis!.getOriginalY(e.offsetY);
      _creatingShapes.update();
    }
  };

  private _handleMouseUp = () => {
    if (this._isShapePicked) {
      this._previousPolygonCoordinates = this.getPolygonCoordinates();
      this._isShapePicked = false;
    } else if (this._selectedPoint) {
      this._selectedPoint = null;
      this._previousPointCoordinate = null;
    }
  };

  private _handleRightMouseUp = () => {
    // 归档创建中的图形
    if (this._creatingShapes) {
      const points = [];
      // 最后一个点不需要加入标注
      for (let i = 0; i < this._creatingShapes.shapes.length - 1; i++) {
        const shape = this._creatingShapes.shapes[i];
        if (i === 0) {
          points.push(
            {
              id: shape.id,
              x: axis!.getOriginalX(shape.dynamicCoordinate[0].x),
              y: axis!.getOriginalY(shape.dynamicCoordinate[0].y),
            },
            {
              id: uuid(),
              x: axis!.getOriginalX(shape.dynamicCoordinate[1].x),
              y: axis!.getOriginalY(shape.dynamicCoordinate[1].y),
            },
          );
        } else {
          points.push({
            id: uuid(),
            x: axis!.getOriginalX(shape.dynamicCoordinate[1].x),
            y: axis!.getOriginalY(shape.dynamicCoordinate[1].y),
          });
        }
      }
      const data: PolygonData = {
        id: uuid(),
        pointList: points,
        label: this.activeLabel,
        order: monitor!.getMaxOrder() + 1,
      };

      this._addAnnotation(data);
      this._creatingShapes.destroy();
      this._creatingShapes = null;
      axis!.rerender();
      this.onSelect(new MouseEvent(''), this.drawing!.get(data.id) as AnnotationPolygon);
      monitor!.setSelectedAnnotationId(data.id);
    }
  };

  public getPolygonCoordinates() {
    const { draft } = this;

    if (!draft) {
      return [];
    }

    return cloneDeep(draft.group.shapes[0].dynamicCoordinate);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    if (this._selectionShape) {
      this._selectionShape.render(ctx);
    }

    if (this._creatingShapes) {
      this._creatingShapes.render(ctx);
    }
  }

  public destroy(): void {
    super.destroy();

    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleMouseUp);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }
}
