import cloneDeep from 'lodash.clonedeep';

import uid from '@/utils/uid';

import { EInternalEvent } from '../enums';
import type { PointStyle } from '../shapes/Point.shape';
import { Point } from '../shapes/Point.shape';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { PointData } from '../annotations/Point.annotation';
import { AnnotationPoint } from '../annotations/Point.annotation';
import { axis, monitor } from '../singletons';
import { DraftPoint } from '../drafts';
import { ToolWrapper } from './Tool.decorator';

/**
 * 点标注工具配置
 */
export interface PointToolOptions extends BasicToolParams<PointData, PointStyle> {
  /**
   * 上限点数
   *
   * @default undefined 默认无限制
   */
  maxPointAmount?: number;

  /**
   * 下限点数
   *
   * @default 0
   */
  minPointAmount?: number;

  /**
   * 图片外标注
   * @default true;
   */
  outOfImage?: boolean;
}

// @ts-ignore
@ToolWrapper
export class PointTool extends Tool<PointData, PointStyle, PointToolOptions> {
  static convertToCanvasCoordinates(data: PointData[]) {
    return data.map((item) => ({
      ...item,
      ...axis!.convertSourceCoordinate(item),
    }));
  }

  static create({ data, ...config }: PointToolOptions) {
    return new PointTool({ ...config, data: PointTool.convertToCanvasCoordinates(data ?? []) });
  }

  public draft: DraftPoint | null = null;

  constructor(params: PointToolOptions) {
    super({
      name: 'point',
      labels: [],
      maxPointAmount: Infinity,
      minPointAmount: 0,
      outOfImage: true,
      data: [],
      // ----------------
      ...params,
      style: {
        ...Point.DEFAULT_STYLE,
        ...params.style,
      },
    });

    AnnotationPoint.buildLabelMapping(params.labels ?? []);

    this.setupShapes();
  }

  public load(data: PointData[]) {
    this._data.push(...PointTool.convertToCanvasCoordinates(data));
    this.clearDrawing();
    this.setupShapes();
  }

  protected setupShapes() {
    for (const item of this._data) {
      this._addAnnotation(item);
    }
  }

  private _validate() {
    const { config, data } = this;

    if (data.length >= config.maxPointAmount!) {
      Tool.error({
        type: 'maxPointAmount',
        message: `Maximum number of points reached!`,
        value: config.maxPointAmount,
      });

      return false;
    }

    return true;
  }

  private _createDraft(data: PointData) {
    const { style, config } = this;

    this.draft = new DraftPoint(config, {
      id: data.id || uid(),
      data,
      showOrder: this.showOrder,
      style,
    });
    this.draft.group.on(EInternalEvent.UnSelect, () => {
      this.archiveDraft();
      axis?.rerender();
    });
    monitor!.setSelectedAnnotationId(this.draft.id);
  }

  private _addAnnotation(data: PointData) {
    const { style, hoveredStyle } = this;

    const annotation = new AnnotationPoint({
      id: data.id,
      data,
      showOrder: this.showOrder,
      style,
      hoveredStyle,
    });

    annotation.group.on(EInternalEvent.Select, this.onSelect(annotation));

    this.drawing!.set(data.id, annotation);
  }

  protected handleDelete = () => {
    const { draft } = this;

    // 如果正在创建，则取消创建
    if (draft) {
      // 如果选中了草稿，则删除草稿
      const data = cloneDeep(draft.data);
      this.deleteDraft();
      this.removeFromDrawing(data.id);
      Tool.onDelete({ ...data, ...axis!.convertCanvasCoordinate(data) });
    }
  };

  protected onSelect = (annotation: AnnotationPoint) => (_e: MouseEvent) => {
    if (!this.requestEdit('update')) {
      return;
    }

    this.archiveDraft();
    this._createDraft(annotation.data);
    this.onAnnotationSelect(annotation.data);
    Tool.emitSelect(this.convertAnnotationItem(this.draft!.data), this.name, _e);
  };

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

  protected handleMouseDown = (e: MouseEvent) => {
    // ====================== 绘制 ======================

    const { activeLabel, config, draft } = this;

    const isUnderDraft = draft && draft.isUnderCursor({ x: e.offsetX, y: e.offsetY });

    // 1. 没有激活工具则不进行绘制
    // 2. 按下空格键时不进行绘制
    if (isUnderDraft) {
      return;
    }

    this.archiveDraft();

    if (!this._validate()) {
      return;
    }

    const data = {
      order: monitor!.getNextOrder(),
      id: uid(),
      label: activeLabel,
      // 超出安全区域的点直接落在安全区域边缘
      x: axis!.getOriginalX(config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX)),
      y: axis!.getOriginalY(config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY)),
    };

    // 创建草稿
    this._createDraft(data);

    axis?.rerender();
    Tool.onAdd([{ ...data, ...axis!.convertCanvasCoordinate(data) }], e);
  };

  public rebuildDraft(data?: PointData) {
    if (!this.draft) {
      return;
    }

    const dataClone = cloneDeep(data ?? this.draft.data);

    this.draft.destroy();
    this.draft = null;
    this._createDraft(dataClone);
  }

  protected convertAnnotationItem(data: PointData) {
    return {
      ...data,
      ...axis!.convertCanvasCoordinate(data),
    };
  }
}
