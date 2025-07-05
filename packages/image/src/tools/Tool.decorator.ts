import cloneDeep from 'lodash.clonedeep';

import { axis, eventEmitter, monitor } from '../singletons';
import { EInternalEvent } from '../enums';
import type { BasicImageAnnotation } from '../interface';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';

type Constructor<T extends {}> = new (...args: any[]) => T;

/**
 * 工具装饰器
 *
 * @description
 * 对于工具的一些对外的通用逻辑，可以通过装饰器的方式来实现。
 * 比如：
 * - 删除标注
 * - 标注数据转换：get data()
 * - 设置标签 label
 * - 设置标签属性 attributes
 * ...
 * 而具体的 xxx.tool.ts文件中，只需要关注具体的工具逻辑即可。
 */
export function ToolWrapper<
  T extends Constructor<Tool<Data, Style, Options>>,
  Data extends BasicImageAnnotation,
  Options extends BasicToolParams<Data, Style>,
  Style extends Record<string, any>,
>(constructor: T): T {
  return class WrappedTool extends constructor {
    isDuplicatedRelation?: (sourceId: string, targetId: string, label?: string) => boolean;

    constructor(...params: any[]) {
      super(...params);

      eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
      eventEmitter.on(EInternalEvent.MouseMove, this.handleMouseMove);
      eventEmitter.on(EInternalEvent.Escape, this.handleEscape);
      eventEmitter.on(EInternalEvent.Delete, this._handleDelete);
      eventEmitter.on(EInternalEvent.BackSpace, this._handleDelete);
    }

    private _handleLeftMouseDown = (e: MouseEvent) => {
      if (!this.activeLabel || monitor?.keyboard.Space || !this.requestEdit('create')) {
        return;
      }

      if (this.handleMouseDown) {
        this.handleMouseDown(e);
      }
    };

    private _handleDelete = (e: KeyboardEvent) => {
      if (!this.requestEdit('delete')) {
        return;
      }

      if (this.handleDelete) {
        this.handleDelete(e);
      }

      axis?.rerender();
    };

    public deleteAnnotation(id: string) {
      if (!this.requestEdit('delete')) {
        return;
      }

      const { draft } = this;

      // 如果正在创建，则取消创建
      if (draft && draft.id === id) {
        // 如果选中了草稿，则删除草稿
        const data = cloneDeep(draft.data);
        this.deleteDraft();
        Tool.onDelete(this!.convertAnnotationItem(data));
      } else {
        const data = cloneDeep(this.drawing!.get(id)!.data);
        this.removeFromDrawing(id);
        Tool.onDelete(this!.convertAnnotationItem(data));
      }

      axis?.rerender();
    }

    public setLabel(value: string): boolean {
      const { draft, activeLabel } = this;

      if (activeLabel && activeLabel === value) {
        return false;
      }

      // 关联关系需要检查是否重复
      if (this.name === 'relation' && this.isDuplicatedRelation && this.draft) {
        const relationData = this.draft!.data as any;
        if (this.isDuplicatedRelation(relationData.sourceId, relationData.targetId, value)) {
          return false;
        }
      }

      this.activate(value);

      if (draft) {
        const data = cloneDeep(draft.data);

        this.rebuildDraft({
          ...data,
          label: value,
        });
      }

      // 更新正在绘制过程中的草稿样式
      this.updateSketchStyleByLabel(value);

      eventEmitter.emit('labelChange', value);

      return true;
    }

    /**
     * 设置标签属性
     */
    public setAttributes(attributes: Record<string, string | string[]>) {
      const { draft } = this;

      if (!draft) {
        console.warn('draft is not exist, annotation must be selected before set attributes.');
        return;
      }

      if (typeof attributes !== 'object' || Array.isArray(attributes)) {
        console.warn('attributes must be an object, but got: ', attributes);

        return;
      }

      const data = {
        ...cloneDeep(draft.data),
        attributes,
      };

      eventEmitter.emit('attributesChange', this.convertAnnotationItem(data));

      this.rebuildDraft(data);
      eventEmitter.emit('change');
    }

    public toggleOrderVisible(visible: boolean): void {
      this.showOrder = visible;

      this.refresh();
    }

    /**
     * 切换标注的可见性
     */
    public toggleAnnotationsVisibility(ids: string[], visible: boolean): void {
      this.drawing?.forEach((item) => {
        if (ids.includes(item.id)) {
          item.data.visible = visible;
          item.group.updateStyle({
            opacity: visible ? 1 : 0,
          } as any);
          item.doms.forEach((dom) => {
            if (visible) {
              dom.show();
            } else {
              dom.hide();
            }
          });
        }
      });

      if (this.draft && ids.includes(this.draft.id)) {
        this.draft.data.visible = visible;
        this.draft.group.updateStyle({
          opacity: visible ? 1 : 0,
        } as any);
      }
    }

    public refresh() {
      this.clearDrawing();
      this.setupShapes();
    }

    public deactivate(): void {
      super.deactivate();
      this.archiveDraft();
      this.destroySketch();
      axis!.rerender();
    }

    public clear() {
      this.clearDrawing();
      this._data = [];

      if (this.draft) {
        this.deleteDraft();
      }
    }

    public get data() {
      const result = super.data;

      return result.map((item) => {
        return this.convertAnnotationItem(item);
      }) as unknown as Data[];
    }

    public destroy() {
      super.destroy();

      eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
      eventEmitter.off(EInternalEvent.MouseMove, this.handleMouseMove);
      eventEmitter.off(EInternalEvent.Escape, this.handleEscape);
      eventEmitter.off(EInternalEvent.Delete, this._handleDelete);
      eventEmitter.off(EInternalEvent.BackSpace, this._handleDelete);
    }
  };
}
