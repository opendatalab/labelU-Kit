import { v4 as uuid } from 'uuid';
import type { BBox } from 'rbush';
import cloneDeep from 'lodash.clonedeep';

import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { RectData } from '../annotation';
import { AnnotationRect } from '../annotation';
import type { AxisPoint, PointStyle, RectStyle } from '../shapes';
import { Rect, Point } from '../shapes';
import { axis, eventEmitter, monitor } from '../singletons';
import type { AnnotationParams } from '../annotation/Annotation';
import { Annotation } from '../annotation/Annotation';
import { EInternalEvent } from '../enums';

type ControllerPosition = 'nw' | 'ne' | 'se' | 'sw';

class DraftRect extends Annotation<RectData, Rect | Point, RectStyle | PointStyle> {
  public pointPositionMapping: Map<ControllerPosition, Point> = new Map();
  constructor(params: AnnotationParams<RectData, RectStyle>) {
    super(params);

    this._setupShapes();
  }

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
      const point = new Point({
        id: uuid(),
        name: points[i].name,
        coordinate: points[i],
        style: { ...style, radius: 8, stroke: 'transparent', fill: 'blue' },
        groupIgnoreRadius: true,
      });

      this.pointPositionMapping.set(points[i].name as ControllerPosition, point);

      group.add(point);
    }
  }

  public syncCoordToData() {
    const { group, data } = this;

    data.x = axis!.getOriginalX(group.bbox.minX);
    data.y = axis!.getOriginalY(group.bbox.minY);
    data.width = axis!.getOriginalX(group.bbox.maxX) - data.x;
    data.height = axis!.getOriginalY(group.bbox.maxY) - data.y;
  }
}

export interface RectToolOptions extends BasicToolParams<RectData, RectStyle> {
  /**
   * 边缘吸附
   * @default true;
   */
  edgeAdsorptive?: boolean;

  /**
   * 最小宽度
   *
   * @default 1
   */
  minWidth?: number;

  /**
   * 最小高度
   *
   * @default 1
   */
  minHeight?: number;

  /**
   * 画布外标注
   * @default true;
   */
  outOfCanvas?: boolean;
}

export class RectTool extends Tool<RectData, RectStyle, RectToolOptions> {
  /**
   * 选中端点
   */
  private _selectedPoint: Point | null = null;

  private _isShapePicked: boolean = false;

  private _preBBox: BBox | null = null;

  private _creatingShape: Rect | null = null;

  private _positionSwitchingMap: Record<ControllerPosition, ControllerPosition> = {} as Record<
    ControllerPosition,
    ControllerPosition
  >;

  private _startPoint: AxisPoint | null = null;

  public draft: DraftRect | null = null;

  constructor(params: RectToolOptions) {
    super({
      name: 'rect',
      edgeAdsorptive: true,
      outOfCanvas: true,
      minHeight: 1,
      minWidth: 1,
      labels: [],
      hoveredStyle: {},
      selectedStyle: {},
      // ----------------
      data: [],
      ...params,
      style: {
        ...Rect.DEFAULT_STYLE,
        ...params.style,
      },
    });

    this._init();

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleMouseUp);
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
  protected onSelect = (_e: MouseEvent, annotation: AnnotationRect) => {
    this?._creatingShape?.destroy();
    this._creatingShape = null;
    this.activate(annotation.data.label);
    eventEmitter.emit(EInternalEvent.ToolChange, this.name, annotation.data.label);
    this._archiveDraft();
    this._createDraft(annotation.data);
    // 2. 销毁成品
    this.removeFromDrawing(annotation.id);

    // 3. 记录选中前的坐标
    this.previousCoordinates = this.getCoordinates();

    // 4. 选中标注，创建选框，进入编辑模式
    // 重新渲染
    axis!.rerender();
  };

  protected onUnSelect = (_e: MouseEvent) => {
    this._archiveDraft();
    this?._creatingShape?.destroy();
    this._creatingShape = null;
    // 重新渲染
    axis!.rerender();
  };

  private _init() {
    const { data = [] } = this;

    for (const annotation of data) {
      this._addAnnotation(annotation);
    }
  }

  private _addAnnotation(data: RectData) {
    const { style, hoveredStyle, drawing } = this;

    drawing!.set(
      data.id,
      new AnnotationRect({
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

  private _createDraft(data: RectData) {
    const { style } = this;

    this.draft = new DraftRect({
      id: data.id,
      data,
      style: { ...style, stroke: this.getLabelColor(data.label) },
      // 在草稿上添加取消选中的事件监听
      onUnSelect: this.onUnSelect,
      onBBoxOut: this.handlePointStyle,
      onBBoxOver: this.handlePointStyle,
    });
  }

  private _archiveDraft() {
    const { draft } = this;

    if (draft) {
      this._addAnnotation(draft.data);
      draft.destroy();
      this.draft = null;
    }
  }

  private _handleMouseDown = (e: MouseEvent) => {
    const { draft, _creatingShape } = this;

    if (draft && !_creatingShape) {
      // ====================== 点击点 ======================
      draft.group.each((shape) => {
        if (shape instanceof Point) {
          if (shape.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
            this._selectedPoint = shape;

            return false;
          }
        }
      });

      // 选中点后不继续执行
      if (this._selectedPoint) {
        this._preBBox = cloneDeep(draft.group.bbox);
        return;
      }

      if (draft.group.isShapesUnderCursor({ x: e.offsetX, y: e.offsetY })) {
        this._isShapePicked = true;
        this.previousCoordinates = this.getCoordinates();

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

    if (_creatingShape) {
      this._createDraft({
        id: _creatingShape.id,
        x: _creatingShape.coordinate[0].x,
        y: _creatingShape.coordinate[0].y,
        label: activeLabel,
        width: _creatingShape.width,
        height: _creatingShape.height,
        order: monitor!.getMaxOrder() + 1,
      });
      _creatingShape.destroy();
      this._creatingShape = null;
      monitor!.setSelectedAnnotationId(_creatingShape.id);
      axis!.rerender();
    } else {
      // 记录起始点坐标
      this._startPoint = axis!.getOriginalCoord({
        x: e.offsetX - axis!.distance.x,
        y: e.offsetY - axis!.distance.y,
      });

      this._creatingShape = new Rect({
        id: uuid(),
        style: { ...style, stroke: this.getLabelColor(activeLabel) },
        coordinate: cloneDeep(this._startPoint),
        width: 1,
        height: 1,
      });
    }
  };

  private _handleMouseMove = (e: MouseEvent) => {
    const {
      draft,
      _selectedPoint,
      previousCoordinates,
      _preBBox,
      _creatingShape,
      _isShapePicked: _isRectPicked,
      _startPoint,
    } = this;

    // 选中点
    if (draft && _selectedPoint && _preBBox) {
      _selectedPoint.coordinate = [
        axis!.getOriginalCoord({
          x: e.offsetX,
          y: e.offsetY,
        }),
      ];

      const { name: selectedPointName } = _selectedPoint;
      const { x, y } = _selectedPoint.dynamicCoordinate[0];
      const nwPoint = draft.pointPositionMapping.get('nw')!;
      const nePoint = draft.pointPositionMapping.get('ne')!;
      const sePoint = draft.pointPositionMapping.get('se')!;
      const swPoint = draft.pointPositionMapping.get('sw')!;

      // 更新端点坐标
      if (selectedPointName === 'nw') {
        swPoint.coordinate[0].x = axis!.getOriginalX(e.offsetX);
        nePoint.coordinate[0].y = axis!.getOriginalY(e.offsetY);
      } else if (selectedPointName === 'ne') {
        sePoint.coordinate[0].x = axis!.getOriginalX(e.offsetX);
        nwPoint.coordinate[0].y = axis!.getOriginalY(e.offsetY);
      } else if (selectedPointName === 'se') {
        nePoint.coordinate[0].x = axis!.getOriginalX(e.offsetX);
        swPoint.coordinate[0].y = axis!.getOriginalY(e.offsetY);
      } else if (selectedPointName === 'sw') {
        nwPoint.coordinate[0].x = axis!.getOriginalX(e.offsetX);
        sePoint.coordinate[0].y = axis!.getOriginalY(e.offsetY);
      }

      const switchingMap: Record<ControllerPosition, ControllerPosition> = {} as Record<
        ControllerPosition,
        ControllerPosition
      >;

      // 更新矩形的坐标
      draft.group.each((shape) => {
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
      draft.group.update();

      draft.syncCoordToData();
    } else if (draft && _isRectPicked) {
      // 更新草稿坐标
      draft.group.each((shape, index) => {
        shape.coordinate = [
          axis!.getOriginalCoord({
            x: previousCoordinates[index][0].x + axis!.distance.x,
            y: previousCoordinates[index][0].y + axis!.distance.y,
          }),
        ];
      });

      // 手动更新组合的包围盒
      draft.group.update();

      draft.syncCoordToData();
    } else if (_creatingShape && _startPoint) {
      if (e.offsetX < axis!.getScaledX(_startPoint.x)) {
        _creatingShape.coordinate[0].x = axis!.getOriginalX(e.offsetX);
      } else {
        _creatingShape.coordinate[0].x = _startPoint.x;
      }

      if (e.offsetY < axis!.getScaledY(_startPoint.y)) {
        _creatingShape.coordinate[0].y = axis!.getOriginalY(e.offsetY);
      } else {
        _creatingShape.coordinate[0].y = _startPoint.y;
      }

      _creatingShape.width = Math.abs(axis!.getOriginalX(e.offsetX) - _startPoint.x);
      _creatingShape.height = Math.abs(axis!.getOriginalY(e.offsetY) - _startPoint.y);

      _creatingShape.update();
    }
  };

  private _handleMouseUp = () => {
    const { _positionSwitchingMap } = this;

    if (this._isShapePicked) {
      this.previousCoordinates = this.getCoordinates();
      this._isShapePicked = false;
    } else if (this._selectedPoint) {
      this._selectedPoint = null;
      this._preBBox = cloneDeep(this.draft!.group.bbox);

      // 拖动点松开鼠标后，重新建立草稿，更新点的方位
      this.draft?.group.each((shape) => {
        if (shape instanceof Point && shape.name && shape.name in _positionSwitchingMap) {
          shape.name = _positionSwitchingMap[shape.name as ControllerPosition] as ControllerPosition;
          this.draft?.pointPositionMapping.set(shape.name as ControllerPosition, shape);
        }
      });
      this._positionSwitchingMap = {} as Record<ControllerPosition, ControllerPosition>;
    }
  };

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    if (this._creatingShape) {
      this._creatingShape.render(ctx);
    }
  }

  public destroy(): void {
    super.destroy();

    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleMouseUp);
  }
}
