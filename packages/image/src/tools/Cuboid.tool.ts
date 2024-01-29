import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { CuboidData, CuboidStyle } from '../annotations';
import { Annotation, AnnotationCuboid } from '../annotations';
import type { AxisPoint, LineStyle, RectStyle } from '../shapes';
import { Line, Group, Rect } from '../shapes';
import { axis, monitor } from '../singletons';
import { EInternalEvent } from '../enums';
import mapValues from '../utils/mapValues';
import { DraftCuboid } from '../drafts/Cuboid.draft';
import { ToolWrapper } from './Tool.decorator';

export interface CuboidToolOptions extends BasicToolParams<CuboidData, CuboidStyle> {
  /**
   * 图片外标注
   * @default true;
   */
  outOfImage?: boolean;
}

// @ts-ignore
@ToolWrapper
export class CuboidTool extends Tool<CuboidData, CuboidStyle, CuboidToolOptions> {
  static convertToCanvasCoordinates(data: CuboidData[]) {
    return data.map((item) => ({
      ...item,
      front: mapValues(item.front, (point) => axis!.convertSourceCoordinate(point)),
      back: mapValues(item.back, (point) => axis!.convertSourceCoordinate(point)),
    }));
  }

  public sketch: Group<Rect | Line, RectStyle | LineStyle> | null = null;

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

    this.setupShapes();
  }

  /**
   * 点击画布事件处理
   */
  protected onSelect = (annotation: AnnotationCuboid) => (_e: MouseEvent) => {
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

  private _addAnnotation(data: CuboidData) {
    const { drawing, style, hoveredStyle } = this;

    const annotation = new AnnotationCuboid({
      id: data.id,
      data,
      showOrder: this.showOrder,
      style,
      hoveredStyle,
    });

    annotation.group.on(EInternalEvent.Select, this.onSelect(annotation));

    drawing!.set(data.id, annotation);
  }

  private _createDraft(data: CuboidData) {
    this.draft = new DraftCuboid(this.config, {
      id: data.id,
      data,
      showOrder: false,
      style: this.style,
    });

    // 在草稿上添加取消选中的事件监听
    this.draft.group.on(EInternalEvent.UnSelect, () => {
      this.archiveDraft();
      axis!.rerender();
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

  protected rebuildDraft(data?: CuboidData) {
    if (!this.draft) {
      return;
    }

    const dataClone = cloneDeep(data ?? this.draft.data);

    this.draft.destroy();
    this.draft = null;
    this._createDraft(dataClone);
  }

  private _archiveSketch(_e: MouseEvent) {
    const { sketch, activeLabel } = this;

    if (!sketch) {
      return;
    }

    const frontRect = sketch.shapes[0] as Rect;
    const backRect = sketch.shapes[5] as Rect;

    const data: CuboidData = {
      id: sketch.id,
      direction: 'front',
      front: {
        tl: {
          x: frontRect.coordinate[0].x,
          y: frontRect.coordinate[0].y,
        },
        tr: {
          x: frontRect.coordinate[0].x + frontRect.width,
          y: frontRect.coordinate[0].y,
        },
        br: {
          x: frontRect.coordinate[0].x + frontRect.width,
          y: frontRect.coordinate[0].y + frontRect.height,
        },
        bl: {
          x: frontRect.coordinate[0].x,
          y: frontRect.coordinate[0].y + frontRect.height,
        },
      },
      back: {
        tl: {
          x: backRect.coordinate[0].x,
          y: backRect.coordinate[0].y,
        },
        tr: {
          x: backRect.coordinate[0].x + backRect.width,
          y: backRect.coordinate[0].y,
        },
        br: {
          x: backRect.coordinate[0].x + backRect.width,
          y: backRect.coordinate[0].y + backRect.height,
        },
        bl: {
          x: backRect.coordinate[0].x,
          y: backRect.coordinate[0].y + backRect.height,
        },
      },
      label: activeLabel,
      order: monitor!.getNextOrder(),
    };

    this._createDraft(data);
    sketch.destroy();
    this.sketch = null;
    monitor!.setSelectedAnnotationId(sketch.id);
    axis!.rerender();

    Tool.onAdd(
      [
        {
          ...data,
          ...this.convertAnnotationItem(data),
        },
      ],
      _e,
    );
  }

  // ================== 键盘事件 ==================
  /**
   * Esc键取消绘制
   */
  protected handleEscape = () => {
    this.sketch?.destroy();
    this.sketch = null;
    axis?.rerender();
  };

  protected handleDelete = () => {
    const { sketch, draft } = this;

    // 如果正在创建，则取消创建
    if (sketch) {
      sketch.destroy();
      this.sketch = null;
      axis?.rerender();
    } else if (draft) {
      // 如果选中了草稿，则删除草稿
      const data = cloneDeep(draft.data);
      this.deleteDraft();
      this.removeFromDrawing(data.id);
      axis?.rerender();
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

    // 记录起始点坐标
    this._startPoint = axis!.getOriginalCoord({
      // 超出安全区域的点直接落在安全区域边缘
      x: config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX),
      y: config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY),
    });

    if (!sketch) {
      this.sketch = new Group(uuid(), monitor!.getNextOrder());

      this.sketch.add(
        new Rect({
          id: uuid(),
          style: {
            ...style,
            stroke: AnnotationCuboid.labelStatic.getLabelColor(activeLabel),
            strokeWidth: Annotation.strokeWidth,
          },
          coordinate: cloneDeep(this._startPoint),
          width: 1,
          height: 1,
        }),
      );
    } else if (sketch.shapes.length === 1) {
      const frontRect = sketch.shapes[0] as Rect;

      sketch.add(
        new Line({
          id: uuid(),
          style: {
            ...style,
            stroke: AnnotationCuboid.labelStatic.getLabelColor(activeLabel),
            strokeWidth: Annotation.strokeWidth,
          },
          coordinate: [
            {
              x: frontRect.coordinate[0].x,
              y: frontRect.coordinate[0].y,
            },
            {
              x: frontRect.coordinate[0].x,
              y: frontRect.coordinate[0].y,
            },
          ],
        }),
        new Line({
          id: uuid(),
          style: {
            ...style,
            stroke: AnnotationCuboid.labelStatic.getLabelColor(activeLabel),
            strokeWidth: Annotation.strokeWidth,
          },
          coordinate: [
            {
              x: frontRect.coordinate[0].x + frontRect.width,
              y: frontRect.coordinate[0].y,
            },
            {
              x: frontRect.coordinate[0].x + frontRect.width,
              y: frontRect.coordinate[0].y,
            },
          ],
        }),
        new Line({
          id: uuid(),
          style: {
            ...style,
            stroke: AnnotationCuboid.labelStatic.getLabelColor(activeLabel),
            strokeWidth: Annotation.strokeWidth,
          },
          coordinate: [
            {
              x: frontRect.coordinate[0].x + frontRect.width,
              y: frontRect.coordinate[0].y + frontRect.height,
            },
            {
              x: frontRect.coordinate[0].x + frontRect.width,
              y: frontRect.coordinate[0].y + frontRect.height,
            },
          ],
        }),
        new Line({
          id: uuid(),
          style: {
            ...style,
            stroke: AnnotationCuboid.labelStatic.getLabelColor(activeLabel),
            strokeWidth: Annotation.strokeWidth,
          },
          coordinate: [
            {
              x: frontRect.coordinate[0].x,
              y: frontRect.coordinate[0].y + frontRect.height,
            },
            {
              x: frontRect.coordinate[0].x,
              y: frontRect.coordinate[0].y + frontRect.height,
            },
          ],
        }),
        new Rect({
          id: uuid(),
          style: {
            ...style,
            stroke: AnnotationCuboid.labelStatic.getLabelColor(activeLabel),
            strokeWidth: Annotation.strokeWidth,
          },
          coordinate: cloneDeep(frontRect.plainCoordinate)[0],
          width: frontRect.width,
          height: frontRect.height,
        }),
      );
    } else {
      this._archiveSketch(e);
    }
  };

  protected handleMouseMove = (e: MouseEvent) => {
    const { sketch, _startPoint, config } = this;

    if (!sketch || !_startPoint) {
      return;
    }

    const frontRect = sketch.shapes[0] as Rect;

    const scaledX = config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX);
    const scaledY = config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY);
    let x = axis!.getOriginalX(scaledX);
    let y = axis!.getOriginalY(scaledY);

    if (sketch.shapes.length === 1) {
      if (e.offsetX < axis!.getScaledX(_startPoint.x)) {
        frontRect.coordinate[0].x = x;
      } else {
        frontRect.coordinate[0].x = _startPoint.x;
      }

      if (e.offsetY < axis!.getScaledY(_startPoint.y)) {
        frontRect.coordinate[0].y = y;
      } else {
        frontRect.coordinate[0].y = _startPoint.y;
      }

      frontRect.width = Math.abs(x - _startPoint.x);
      frontRect.height = Math.abs(y - _startPoint.y);
    } else if (sketch.shapes.length > 1) {
      const backRect = sketch.shapes[5] as Rect;

      // 后面的矩形也需要在安全区域内
      y = axis!.getOriginalY(axis!.getSafeY(scaledY - backRect.height * axis!.scale)) + backRect.height;
      x = axis!.getOriginalX(axis!.getSafeX(scaledX - backRect.width * axis!.scale)) + backRect.width;

      if (y > frontRect.plainCoordinate[0].y + frontRect.height) {
        y = frontRect.plainCoordinate[0].y + frontRect.height;
      }

      const tl = {
        x: x - frontRect.width,
        y: y - frontRect.height,
      };
      const tr = {
        x,
        y: y - frontRect.height,
      };
      const br = {
        x,
        y,
      };
      const bl = {
        x: x - frontRect.width,
        y: y,
      };

      backRect.coordinate[0] = tl;
      sketch.shapes[1].coordinate[1] = tl;
      sketch.shapes[2].coordinate[1] = tr;
      sketch.shapes[3].coordinate[1] = br;
      sketch.shapes[4].coordinate[1] = bl;
    }

    sketch.update();
  };

  protected convertAnnotationItem(data: CuboidData) {
    return {
      ...data,
      front: mapValues(data.front, (point) => axis!.convertCanvasCoordinate(point)),
      back: mapValues(data.back, (point) => axis!.convertCanvasCoordinate(point)),
    };
  }
}
