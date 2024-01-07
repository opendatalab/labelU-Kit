import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { CuboidData, CuboidStyle } from '../annotations';
import { AnnotationCuboid } from '../annotations';
import type { AxisPoint } from '../shapes';
import { Rect, Point } from '../shapes';
import { axis, eventEmitter, monitor } from '../singletons';
import { EInternalEvent } from '../enums';
import mapValues from '../utils/mapValues';
import { DraftCuboid } from '../drafts/Cuboid.draft';

export interface CuboidToolOptions extends BasicToolParams<CuboidData, CuboidStyle> {
  /**
   * 图片外标注
   * @default true;
   */
  outOfImage?: boolean;
}

export class CuboidTool extends Tool<CuboidData, CuboidStyle, CuboidToolOptions> {
  static convertToCanvasCoordinates(data: CuboidData[]) {
    return data.map((item) => ({
      ...item,
      front: mapValues(item.front, (point) => axis!.convertSourceCoordinate(point)),
      back: mapValues(item.back, (point) => axis!.convertSourceCoordinate(point)),
    }));
  }

  private _creatingShape: Rect | null = null;

  private _startPoint: AxisPoint | null = null;

  public draft: DraftCuboid | null = null;

  constructor(params: CuboidToolOptions) {
    super({
      name: 'cuboid',
      outOfImage: true,
      labels: [],
      // ----------------
      data: [],
      ...params,
      style: {
        ...Rect.DEFAULT_STYLE,
        ...params.style,
      },
    });
    AnnotationCuboid.buildLabelMapping(params.labels ?? []);

    this._setupShapes();

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.Escape, this._handleEscape);
    eventEmitter.on(EInternalEvent.Delete, this._handleDelete);
    eventEmitter.on(EInternalEvent.BackSpace, this._handleDelete);
  }

  /**
   * 点击画布事件处理
   */
  protected onSelect = (_e: MouseEvent, annotation: AnnotationCuboid) => {
    Tool.emitSelect(this._convertAnnotationItem(annotation.data));
    this?._creatingShape?.destroy();
    this._creatingShape = null;
    this.activate(annotation.data.label);
    eventEmitter.emit(EInternalEvent.ToolChange, this.name, annotation.data.label);
    this._archiveDraft();
    this._createDraft(annotation.data);
    // 2. 销毁成品
    this.removeFromDrawing(annotation.id);
    // 重新渲染
    axis!.rerender();
  };

  protected onUnSelect = (_e: MouseEvent) => {
    if (this.draft) {
      Tool.emitUnSelect(this._convertAnnotationItem(this.draft.data));
    }

    this._archiveDraft();
    this?._creatingShape?.destroy();
    this._creatingShape = null;
    // 重新渲染
    axis!.rerender();
  };

  private _setupShapes() {
    const { _data = [] } = this;

    for (const annotation of _data) {
      this._addAnnotation(annotation);
    }
  }

  private _addAnnotation(data: CuboidData) {
    const { drawing, style, hoveredStyle } = this;

    drawing!.set(
      data.id,
      new AnnotationCuboid({
        id: data.id,
        data,
        showOrder: this.showOrder,
        style,
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

  private _createDraft(data: CuboidData) {
    this.draft = new DraftCuboid(this.config, {
      id: data.id,
      data,
      showOrder: false,
      style: this.style,
      // 在草稿上添加取消选中的事件监听
      onUnSelect: this.onUnSelect,
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

  private _archiveCreatingShapes(_e: MouseEvent) {
    const { _creatingShape } = this;

    if (!_creatingShape) {
      return;
    }

    // const data = {
    //   id: _creatingShape.id,
    //   x: _creatingShape.coordinate[0].x,
    //   y: _creatingShape.coordinate[0].y,
    //   label: activeLabel,
    //   width: _creatingShape.width,
    //   height: _creatingShape.height,
    //   order: monitor!.getNextOrder(),
    // };

    // Tool.onAdd(
    //   {
    //     ...data,
    //     ...this._convertAnnotationItem(data),
    //   },
    //   e,
    // );

    // this._createDraft(data);
    _creatingShape.destroy();
    this._creatingShape = null;
    monitor!.setSelectedAnnotationId(_creatingShape.id);
    axis!.rerender();
  }

  private _rebuildDraft(data?: CuboidData) {
    if (!this.draft) {
      return;
    }

    const dataClone = cloneDeep(data ?? this.draft.data);

    this.draft.destroy();
    this.draft = null;
    this._createDraft(dataClone);
  }

  // ================== 键盘事件 ==================
  /**
   * Esc键取消绘制
   */
  private _handleEscape = () => {
    this._creatingShape?.destroy();
    this._creatingShape = null;
    axis?.rerender();
  };

  private _handleDelete = () => {
    const { _creatingShape, draft } = this;

    // 如果正在创建，则取消创建
    if (_creatingShape) {
      _creatingShape.destroy();
      this._creatingShape = null;
      axis?.rerender();
    } else if (draft) {
      // 如果选中了草稿，则删除草稿
      const data = cloneDeep(draft.data);
      this.deleteDraft();
      axis?.rerender();
      Tool.onDelete(this._convertAnnotationItem(data));
    }
  };

  private _handleMouseDown = (e: MouseEvent) => {
    // ====================== 绘制 ======================
    const { activeLabel, style, draft, config, _creatingShape } = this;

    const isUnderDraft = draft && draft.isRectAndControllersUnderCursor({ x: e.offsetX, y: e.offsetY });

    if (!activeLabel || isUnderDraft || monitor?.keyboard.Space) {
      return;
    }

    // 先归档上一次的草稿
    this._archiveDraft();

    if (_creatingShape) {
      this._archiveCreatingShapes(e);
    } else {
      // 记录起始点坐标
      this._startPoint = axis!.getOriginalCoord({
        // 超出安全区域的点直接落在安全区域边缘
        x: config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX),
        y: config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY),
      });

      this._creatingShape = new Rect({
        id: uuid(),
        style,
        coordinate: cloneDeep(this._startPoint),
        width: 1,
        height: 1,
      });
    }
  };

  private _handleMouseMove = (e: MouseEvent) => {
    const { _creatingShape, _startPoint, config } = this;

    const x = axis!.getOriginalX(config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX));
    const y = axis!.getOriginalY(config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY));

    if (_creatingShape && _startPoint) {
      if (e.offsetX < axis!.getScaledX(_startPoint.x)) {
        _creatingShape.coordinate[0].x = x;
      } else {
        _creatingShape.coordinate[0].x = _startPoint.x;
      }

      if (e.offsetY < axis!.getScaledY(_startPoint.y)) {
        _creatingShape.coordinate[0].y = y;
      } else {
        _creatingShape.coordinate[0].y = _startPoint.y;
      }

      _creatingShape.width = Math.abs(x - _startPoint.x);
      _creatingShape.height = Math.abs(y - _startPoint.y);

      _creatingShape.update();
    }
  };

  private _convertAnnotationItem(data: CuboidData) {
    return {
      ...data,
      front: mapValues(data.front, (point) => axis!.convertCanvasCoordinate(point)),
      back: mapValues(data.back, (point) => axis!.convertCanvasCoordinate(point)),
    };
  }

  public deactivate(): void {
    super.deactivate();
    this._archiveDraft();
    axis!.rerender();
  }

  public toggleOrderVisible(visible: boolean): void {
    this.showOrder = visible;

    this.clearDrawing();
    this._setupShapes();
  }

  public setLabel(value: string): void {
    const { draft, activeLabel } = this;

    if (!draft || !activeLabel || activeLabel === value) {
      return;
    }

    this.activate(value);

    const data = cloneDeep(draft.data);

    this._rebuildDraft({
      ...data,
      label: value,
    });
  }

  public get data() {
    const result = super.data;

    return result.map((item) => {
      return this._convertAnnotationItem(item);
    }) as unknown as CuboidData[];
  }

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
    eventEmitter.off(EInternalEvent.Escape, this._handleEscape);
    eventEmitter.off(EInternalEvent.Delete, this._handleDelete);
    eventEmitter.off(EInternalEvent.BackSpace, this._handleDelete);
  }
}
