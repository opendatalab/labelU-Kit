import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';
import Color from 'color';

import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { RectData } from '../annotation';
import { AnnotationRect } from '../annotation';
import type { AxisPoint, RectStyle } from '../shapes';
import { Rect, Point } from '../shapes';
import { axis, eventEmitter, monitor } from '../singletons';
import { EInternalEvent } from '../enums';
import { DraftRect } from '../drafts/Rect.draft';

export interface RectToolOptions extends BasicToolParams<RectData, RectStyle> {
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
  static convertToCanvasCoordinates(data: RectData[]) {
    return data.map((item) => ({
      ...item,
      ...axis!.convertSourceCoordinate(item),
    }));
  }

  private _creatingShape: Rect | null = null;

  private _startPoint: AxisPoint | null = null;

  public draft: DraftRect | null = null;

  constructor(params: RectToolOptions) {
    super({
      name: 'rect',
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
    const { drawing } = this;

    drawing!.set(
      data.id,
      new AnnotationRect({
        id: data.id,
        data,
        label: this.getLabelText(data.label),
        style: this._makeStaticStyle(data.label),
        hoveredStyle: this._makeHoveredStyle(data.label),
        onSelect: this.onSelect,
      }),
    );
  }

  private _makeStaticStyle(label?: string) {
    const { style } = this;

    if (typeof label !== 'string') {
      throw new Error('Invalid label! Must be string!');
    }

    return { ...style, stroke: this.getLabelColor(label) };
  }

  private _makeHoveredStyle(label?: string) {
    const { style, hoveredStyle } = this;

    if (typeof label !== 'string') {
      throw new Error('Invalid label! Must be string!');
    }

    if (hoveredStyle && Object.keys(hoveredStyle).length > 0) {
      return hoveredStyle;
    }

    const labelColor = this.getLabelColor(label);

    return {
      ...style,
      stroke: labelColor,
      strokeWidth: style.strokeWidth! + 2,
      fill: Color(labelColor).alpha(0.5).toString(),
    };
  }

  private _makeSelectedStyle(label?: string) {
    const { style, selectedStyle } = this;

    if (typeof label !== 'string') {
      throw new Error('Invalid label! Must be string!');
    }

    if (selectedStyle && Object.keys(selectedStyle).length > 0) {
      return selectedStyle;
    }

    const labelColor = this.getLabelColor(label);

    return {
      ...style,
      stroke: labelColor,
      fill: Color(labelColor).alpha(0.4).toString(),
    };
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
    this.draft = new DraftRect(this.config, {
      id: data.id,
      data,
      label: '',
      style: this._makeSelectedStyle(data.label),
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
    // ====================== 绘制 ======================
    const { activeLabel, style, draft, config, _creatingShape } = this;

    const isUnderDraft = draft && draft.isRectAndControllersUnderCursor({ x: e.offsetX, y: e.offsetY });

    if (!activeLabel || isUnderDraft) {
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
        order: monitor!.getNextOrder(),
      });
      _creatingShape.destroy();
      this._creatingShape = null;
      monitor!.setSelectedAnnotationId(_creatingShape.id);
      axis!.rerender();
    } else {
      // 记录起始点坐标
      this._startPoint = axis!.getOriginalCoord({
        // 超出安全区域的点直接落在安全区域边缘
        x: config.outOfCanvas ? e.offsetX : axis!.getSafeX(e.offsetX),
        y: config.outOfCanvas ? e.offsetY : axis!.getSafeY(e.offsetY),
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
    const { _creatingShape, _startPoint, config } = this;

    const x = axis!.getOriginalX(config.outOfCanvas ? e.offsetX : axis!.getSafeX(e.offsetX));
    const y = axis!.getOriginalY(config.outOfCanvas ? e.offsetY : axis!.getSafeY(e.offsetY));

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

  public deactivate(): void {
    super.deactivate();
    this._archiveDraft();
    axis!.rerender();
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
  }
}
