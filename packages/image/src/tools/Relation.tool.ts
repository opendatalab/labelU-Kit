import cloneDeep from 'lodash.clonedeep';

import uid from '@/utils/uid';
import type { RelationData, ValidAnnotationType } from '@/annotations/Relation.annotation';
import { DraftRelation } from '@/drafts/Relation.draft';
import type { ToolName } from '@/interface';
import type { AxisPoint } from '@/shapes';
import { ShapeText } from '@/shapes';
import { VALID_RELATION_TOOLS } from '@/constant';
import type { RBushItem } from '@/core/CustomRBush';

import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { Annotation } from '../annotations';
import { AnnotationRelation } from '../annotations';
import { axis, eventEmitter, monitor, rbush } from '../singletons';
import { EInternalEvent } from '../enums';
import { Group } from '../shapes/Group';
import { ToolWrapper } from './Tool.decorator';

export type RelationToolOptions = BasicToolParams<RelationData, LineStyle>;

type AnyAnnotation = Annotation<any, any>;

// @ts-ignore
@ToolWrapper
export class RelationTool extends Tool<RelationData, LineStyle, RelationToolOptions> {
  static create({ data, ...config }: RelationToolOptions) {
    return new RelationTool({ ...config, data });
  }

  public sketch: Group | null = null;

  public draft: DraftRelation | null = null;

  private _sourceAnnotation: AnyAnnotation | null = null;
  private _connectAnnotation: AnyAnnotation | null = null;

  private _relationMapByRelation: Map<string, AnnotationRelation> = new Map();

  constructor({ style, ...params }: RelationToolOptions) {
    super({
      name: 'relation',
      labels: [],
      selectedStyle: {},
      // ----------------
      data: [],
      style: {
        ...Line.DEFAULT_STYLE,
        ...style,
      },
      ...params,
    });

    AnnotationRelation.buildLabelMapping(params.labels ?? []);
    eventEmitter.on(EInternalEvent.DraftMove, this._handleDraftMove);
    eventEmitter.on(EInternalEvent.DraftResize, this._handleDraftMove);
    eventEmitter.on(EInternalEvent.DeleteAnnotationInternal, this._handleDeleteAnnotationInternal);
    this.setupShapes();
  }

  public load(data: RelationData[]) {
    this._data.push(...data);
    this.clearDrawing();
    this.setupShapes();
  }

  protected setupShapes() {
    const { _data = [] } = this;

    for (const annotation of _data) {
      this._addAnnotation(annotation);
    }
  }

  /**
   * 点击画布事件处理
   */
  protected onSelect = (annotation: AnnotationRelation) => (_e: MouseEvent) => {
    if (!this.requestEdit('update')) {
      return;
    }

    this.archiveDraft();
    this._createDraft(annotation.data);
    this.onAnnotationSelect(annotation.data);
    monitor!.setSelectedAnnotationId(annotation.id);
    Tool.emitSelect(this.draft!.data, this.name, _e);
  };

  /**
   * 以sourceId和targetId和标签为key，判断是否存在重复的关联关系
   */
  public isDuplicatedRelation = (sourceId: string, targetId: string, label?: string) => {
    return this._relationMapByRelation.has(`${sourceId}-${targetId}-${label ?? this.activeLabel}`);
  };

  private _addAnnotation(data: RelationData) {
    const { drawing, style, hoveredStyle } = this;

    const annotation = new AnnotationRelation({
      id: data.id,
      data,
      name: this.name,
      style,
      hoveredStyle,
      showOrder: this.showOrder,
      getAnnotation: (id: string) => this._getAnnotation(id),
    });

    annotation.group.on(EInternalEvent.Select, this.onSelect(annotation));

    this._relationMapByRelation.set(`${data.sourceId}-${data.targetId}-${data.label}`, annotation);

    drawing!.set(data.id, annotation);
  }

  private _createDraft(data: RelationData) {
    const { style } = this;

    this.draft = new DraftRelation({
      id: data.id,
      data,
      style,
      name: this.name,
      showOrder: this.showOrder,
      getAnnotation: this._getAnnotation,
      isDuplicatedRelation: this.isDuplicatedRelation,
    });

    this.draft.group.on(EInternalEvent.UnSelect, () => {
      this.archiveDraft();
      axis?.rerender();
    });

    this._relationMapByRelation.delete(`${data.sourceId}-${data.targetId}-${data.label}`);
  }

  private _getRelationsByAnnotationId(annotationId: string): AnnotationRelation[] {
    return Array.from(this.drawing!.values()).filter(
      (relation) => relation.data.sourceId === annotationId || relation.data.targetId === annotationId,
    ) as AnnotationRelation[];
  }

  /**
   * 更新关联关系箭头位置
   */
  private _handleDraftMove = (e: MouseEvent, draft: DraftRelation) => {
    const relatedRelations = this._getRelationsByAnnotationId(draft.id);

    if (relatedRelations.length === 0) {
      return;
    }

    const draftCenter = draft.getCenter();
    const originalDraftCenter = {
      x: axis!.getOriginalX(draftCenter!.x),
      y: axis!.getOriginalY(draftCenter!.y),
    };

    for (const relation of relatedRelations) {
      if (draft.id === relation.data.sourceId) {
        relation.group.shapes[0].coordinate[0].x = originalDraftCenter.x;
        relation.group.shapes[0].coordinate[0].y = originalDraftCenter.y;
      } else {
        relation.group.shapes[0].coordinate[1].x = originalDraftCenter.x;
        relation.group.shapes[0].coordinate[1].y = originalDraftCenter.y;
      }

      // 更新文字坐标：线段中点
      if (relation.group.shapes[1] instanceof ShapeText) {
        relation.group.shapes[1].coordinate[0].x =
          (relation.group.shapes[0].coordinate[0].x + relation.group.shapes[0].coordinate[1].x) / 2;
        relation.group.shapes[1].coordinate[0].y =
          (relation.group.shapes[0].coordinate[0].y + relation.group.shapes[0].coordinate[1].y) / 2;
      }
    }
  };

  private _getAnnotation = (id: string) => {
    const tools = this.getTools();

    for (const [toolName, tool] of tools) {
      if (toolName === 'relation') {
        continue;
      }

      if (tool.drawing?.has(id)) {
        return tool.drawing.get(id) as unknown as ValidAnnotationType;
      }

      if (tool.draft?.id === id) {
        return tool.draft as unknown as ValidAnnotationType;
      }
    }
  };

  protected archiveDraft() {
    const { draft } = this;

    if (draft) {
      Tool.emitUnSelect(draft.data);
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
      this._sourceAnnotation = null;
      this._connectAnnotation = null;
    }
  }

  public rebuildDraft(data: RelationData) {
    if (!this.draft) {
      return;
    }

    const dataClone = cloneDeep(data ?? this.draft.data);

    this.draft.destroy();
    this.draft = null;
    this._createDraft(dataClone);
  }

  protected handleMouseDown = (e: MouseEvent) => {
    // ====================== 绘制 ======================
    const { activeLabel, style, draft } = this;

    const isUnderDraft =
      draft &&
      (draft.isUnderCursor({ x: e.offsetX, y: e.offsetY }) ||
        draft.group.isShapesUnderCursor({ x: e.offsetX, y: e.offsetY }));

    if (isUnderDraft) {
      return;
    }

    const hoveredAnnotationId = this._sourceAnnotation ? this._connectAnnotation?.id : monitor?.hoveredGroup?.id;

    if (!hoveredAnnotationId) {
      return;
    }

    // 查找选中的标注
    const selectedAnnotation: ValidAnnotationType | undefined = this._getAnnotation(hoveredAnnotationId);

    if (!selectedAnnotation || !VALID_RELATION_TOOLS.includes(selectedAnnotation.name as any)) {
      return;
    }

    if (!hoveredAnnotationId) {
      return;
    }

    const center = selectedAnnotation.getCenter();
    const sourceCenter = {
      x: axis!.getOriginalX(center!.x),
      y: axis!.getOriginalY(center!.y),
    };
    // 鼠标位置
    const targetCenter = {
      x: sourceCenter.x,
      y: sourceCenter.y,
    };

    // 先归档选中的草稿
    this.archiveDraft();

    if (!this._sourceAnnotation) {
      this._sourceAnnotation = selectedAnnotation;

      // 创建箭头线条
      const arrowLine = new Line({
        id: `arrow_${uid()}`,
        coordinate: [sourceCenter, targetCenter],
        style: { ...style, stroke: AnnotationRelation.labelStatic.getLabelColor(activeLabel) },
      });

      this.sketch = new Group(uid(), monitor!.getNextOrder());
      this.sketch.add(arrowLine);
    } else {
      // 结束绘制
      this._archiveSketch(this._sourceAnnotation, selectedAnnotation, e);
    }

    axis?.rerender();
  };

  private _getConnectAnnotation = (point: AxisPoint) => {
    const rbushItems = rbush
      .getRBushItemsByPointInBBox(point)
      .filter(
        (item: RBushItem) => item._group?.id !== this.sketch?.id && item._group?.id !== this._sourceAnnotation!.id,
      );

    if (!this._sourceAnnotation) {
      return;
    }

    if (rbushItems.length === 0 || !rbushItems[0]._group) {
      return;
    }

    const targetAnnotation = this._getAnnotation(rbushItems[0]._group.id);

    if (!targetAnnotation || !VALID_RELATION_TOOLS.includes(targetAnnotation.name as any)) {
      return;
    }

    if (this.isDuplicatedRelation(this._sourceAnnotation.id, rbushItems[0]._group.id)) {
      return;
    }

    return targetAnnotation;
  };

  private _handleDeleteAnnotationInternal = (toolName: ToolName, data: AnyAnnotation['data']) => {
    if (['rect', 'polygon'].includes(toolName)) {
      const relation = this._getAnnotationBySourceIdOrTargetId(data.id);

      if (relation) {
        this._relationMapByRelation.delete(
          `${relation.data.sourceId}-${relation.data.targetId}-${relation.data.label}`,
        );
        Tool.onDelete(cloneDeep(relation.data));
        this.removeFromDrawing(relation.id);
      }
    }
  };

  private _getAnnotationBySourceIdOrTargetId(id: string) {
    if (!this.drawing) {
      return;
    }

    return Array.from(this.drawing.values()).find(
      (relation) => relation.data.sourceId === id || relation.data.targetId === id,
    );
  }

  protected handleMouseMove = (e: MouseEvent) => {
    const { sketch } = this;

    if (!sketch || !this._sourceAnnotation) {
      return;
    }

    const connectAnnotation = this._getConnectAnnotation({ x: e.offsetX, y: e.offsetY });

    let endPoint = {
      x: axis!.getOriginalX(e.offsetX),
      y: axis!.getOriginalY(e.offsetY),
    };

    if (connectAnnotation) {
      const targetBBox = connectAnnotation.group.getBBoxByFilter((shape) => !(shape instanceof ShapeText));

      endPoint = {
        x: axis!.getOriginalX(targetBBox.minX + (targetBBox.maxX - targetBBox.minX) / 2),
        y: axis!.getOriginalY(targetBBox.minY + (targetBBox.maxY - targetBBox.minY) / 2),
      };

      this._connectAnnotation = connectAnnotation;
    } else {
      this._connectAnnotation = null;
    }

    const line = sketch.last() as Line;

    line.coordinate[1] = endPoint;

    sketch.update();
  };

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

      this._relationMapByRelation.delete(`${data.sourceId}-${data.targetId}-${data.label}`);

      this.deleteDraft();
      this.removeFromDrawing(data.id);
      Tool.onDelete(data);
    }
  };

  protected updateSketchStyleByLabel(label: string) {
    const { sketch, style } = this;

    if (!sketch) {
      return;
    }

    sketch.updateStyle({
      ...style,
      stroke: AnnotationRelation.labelStatic.getLabelColor(label),
    });
  }

  protected convertAnnotationItem(data: RelationData) {
    return data;
  }

  private _archiveSketch(sourceAnnotation: AnyAnnotation, targetAnnotation: AnyAnnotation, e: MouseEvent) {
    const { sketch } = this;

    if (!sketch || !sourceAnnotation || !targetAnnotation) {
      return;
    }

    const data: RelationData = {
      id: sketch.id,
      sourceId: sourceAnnotation.id,
      targetId: targetAnnotation.id,
      order: monitor!.getNextOrder(),
      attributes: {},
      label: this.activeLabel,
    };

    this._createDraft(data);
    monitor!.setSelectedAnnotationId(sketch.id);
    this.destroySketch();
    this._sourceAnnotation = null;
    this._connectAnnotation = null;
    axis!.rerender();
    Tool.onAdd([data], e);
  }

  public destroy(): void {
    super.destroy();
    this._sourceAnnotation = null;
    this._relationMapByRelation.clear();
    eventEmitter.off(EInternalEvent.DraftMove, this._handleDraftMove);
    eventEmitter.off(EInternalEvent.DraftResize, this._handleDraftMove);
    eventEmitter.off(EInternalEvent.DeleteAnnotationInternal, this._handleDeleteAnnotationInternal);
  }
}
