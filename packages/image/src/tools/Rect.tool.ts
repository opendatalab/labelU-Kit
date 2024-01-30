import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { RectData } from '../annotations';
import { AnnotationRect } from '../annotations';
import type { AxisPoint, RectStyle } from '../shapes';
import { Rect } from '../shapes';
import { axis, monitor } from '../singletons';
import { EInternalEvent } from '../enums';
import { DraftRect } from '../drafts/Rect.draft';
import { ToolWrapper } from './Tool.decorator';

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
   * 图片外标注
   * @default true;
   */
  outOfImage?: boolean;
}

// @ts-ignore
@ToolWrapper
export class RectTool extends Tool<RectData, RectStyle, RectToolOptions> {
  static convertToCanvasCoordinates(data: RectData[]) {
    return data.map((item) => ({
      ...item,
      ...axis!.convertSourceCoordinate(item),
      width: item.width * axis!.initialBackgroundScale,
      height: item.height * axis!.initialBackgroundScale,
    }));
  }

  private _startPoint: AxisPoint | null = null;

  public sketch: Rect | null = null;

  public draft: DraftRect | null = null;

  constructor(params: RectToolOptions) {
    super({
      name: 'rect',
      outOfImage: true,
      minHeight: 1,
      minWidth: 1,
      labels: [],
      // ----------------
      data: [],
      ...params,
      style: {
        ...Rect.DEFAULT_STYLE,
        ...params.style,
      },
    });

    AnnotationRect.buildLabelMapping(params.labels ?? []);

    this.setupShapes();
  }

  /**
   * 点击画布事件处理
   *
   * @description
   * 1. 归档上一次的草稿
   * 2. 触发选中事件
   * 3. 触发工具切换事件
   * 4. 创建草稿
   * 5. 销毁drawing的静态图形
   * 6. 重新渲染
   */
  protected onSelect = (annotation: AnnotationRect) => (_e: MouseEvent) => {
    this.archiveDraft();
    this._createDraft(annotation.data);
    this.onAnnotationSelect(annotation.data);
    Tool.emitSelect(this.convertAnnotationItem(this.draft!.data), this.name);
  };

  protected setupShapes() {
    const { _data = [] } = this;

    for (const annotation of _data) {
      this._addAnnotation(annotation);
    }
  }

  private _validate(data: RectData) {
    const { config } = this;

    const realWidth = data.width / axis!.scale;
    const realHeight = data.height / axis!.scale;

    if (realWidth < config.minWidth!) {
      Tool.error({
        type: 'minWidth',
        message: `The width of the rectangle is too small! Minimum width is ${config.minWidth!}!`,
        value: config.minWidth,
      });

      return false;
    }

    if (realHeight < config.minHeight!) {
      Tool.error({
        type: 'minHeight',
        message: `The height of the rectangle is too small! Minimum height is ${config.minHeight!}!`,
        value: config.minHeight,
      });

      return false;
    }

    return true;
  }

  private _addAnnotation(data: RectData) {
    const { drawing, style, hoveredStyle } = this;

    const annotation = new AnnotationRect({
      id: data.id,
      data,
      showOrder: this.showOrder,
      style,
      hoveredStyle,
    });

    annotation.group.on(EInternalEvent.Select, this.onSelect(annotation));

    drawing!.set(data.id, annotation);
  }

  private _createDraft(data: RectData) {
    this.draft = new DraftRect(this.config, {
      id: data.id,
      data,
      showOrder: false,
      style: this.style,
    });

    this.draft.group.on(EInternalEvent.UnSelect, () => {
      this.archiveDraft();
      axis?.rerender();
    });
  }

  protected archiveDraft() {
    const { draft } = this;

    if (draft) {
      Tool.emitUnSelect(this.convertAnnotationItem(draft.data));
      this._addAnnotation(draft.data);
      this.recoverData();
      draft.destroy();
      this.draft = null;
    }
  }

  protected destroySketch() {
    const { sketch } = this;

    if (sketch) {
      sketch.destroy();
      this.sketch = null;
    }
  }

  private _archiveSketch(e: MouseEvent) {
    const { sketch, activeLabel } = this;

    if (!sketch) {
      return;
    }

    const data = {
      id: sketch.id,
      x: sketch.coordinate[0].x,
      y: sketch.coordinate[0].y,
      label: activeLabel,
      width: sketch.width,
      height: sketch.height,
      order: monitor!.getNextOrder(),
    };

    if (!this._validate(data)) {
      return;
    }

    this._createDraft(data);
    this.destroySketch();
    monitor!.setSelectedAnnotationId(sketch.id);
    axis!.rerender();

    Tool.onAdd(
      [
        {
          ...data,
          ...this.convertAnnotationItem(data),
        },
      ],
      e,
    );
  }

  protected rebuildDraft(data?: RectData) {
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
  protected handleEscape = () => {
    this.destroySketch();
    axis?.rerender();
  };

  protected handleDelete = () => {
    const { sketch, draft } = this;

    // 如果正在创建，则取消创建
    if (sketch) {
      this.destroySketch();
    } else if (draft) {
      // 如果选中了草稿，则删除草稿
      const data = cloneDeep(draft.data);
      this.deleteDraft();
      this.removeFromDrawing(data.id);
      Tool.onDelete(this.convertAnnotationItem(data));
    }
  };

  protected handleMouseDown = (e: MouseEvent) => {
    // ====================== 绘制 ======================
    const { activeLabel, style, draft, config, sketch } = this;

    const isUnderDraft = draft && draft.isRectAndControllersUnderCursor({ x: e.offsetX, y: e.offsetY });

    if (!activeLabel || isUnderDraft || monitor?.keyboard.Space) {
      return;
    }

    // 先归档上一次的草稿
    this.archiveDraft();

    if (sketch) {
      this._archiveSketch(e);
    } else {
      // 记录起始点坐标
      this._startPoint = axis!.getOriginalCoord({
        // 超出安全区域的点直接落在安全区域边缘
        x: config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX),
        y: config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY),
      });

      this.sketch = new Rect({
        id: uuid(),
        style: { ...style, stroke: AnnotationRect.labelStatic.getLabelColor(activeLabel) },
        coordinate: cloneDeep(this._startPoint),
        width: 1,
        height: 1,
      });
    }
  };

  protected handleMouseMove = (e: MouseEvent) => {
    const { sketch, _startPoint, config } = this;

    const x = axis!.getOriginalX(config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX));
    const y = axis!.getOriginalY(config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY));

    if (sketch && _startPoint) {
      if (e.offsetX < axis!.getScaledX(_startPoint.x)) {
        sketch.coordinate[0].x = x;
      } else {
        sketch.coordinate[0].x = _startPoint.x;
      }

      if (e.offsetY < axis!.getScaledY(_startPoint.y)) {
        sketch.coordinate[0].y = y;
      } else {
        sketch.coordinate[0].y = _startPoint.y;
      }

      sketch.width = Math.abs(x - _startPoint.x);
      sketch.height = Math.abs(y - _startPoint.y);

      sketch.update();
    }
  };

  protected updateSketchStyleByLabel(label: string) {
    const { sketch, style } = this;

    if (!sketch) {
      return;
    }

    sketch.updateStyle({
      ...style,
      stroke: AnnotationRect.labelStatic.getLabelColor(label),
    });
  }

  protected convertAnnotationItem(data: RectData) {
    return {
      ...data,
      ...axis!.convertCanvasCoordinate(data),
      width: data.width / axis!.initialBackgroundScale,
      height: data.height / axis!.initialBackgroundScale,
    };
  }
}
