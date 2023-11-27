import { EInternalEvent } from '../enums';
import { eventEmitter } from '../singletons';

/**
 * 选中标注的装饰器
 *
 * @description
 * why? 因为可以节省在每个tool当中都写一遍监听事件的代码
 *
 * 用于标注类，用于监听标注被鼠标选中事件；
 * 如果希望实现选中效果，必须在被装饰的类下面定义 onSelect 和 onUnSelect 方法，且必须是箭头函数。
 *
 * @example
 * ```ts
 * @Selection
 * class LineTool {
 *  onSelect = (annotation: AnnotationLine) => {
 *    // do something
 *  }
 *
 *  onUnSelect = (annotation: AnnotationLine) => {
 *    // do something
 *  }
 * }
 */
export function Selection<T extends { new (...args: any[]): any }>(constructor: T) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);

      // 过滤鼠标经过的线条标注
      if (typeof this.onSelect === 'function') {
        eventEmitter.on(EInternalEvent.Select, this._onSelect);
      }

      // 监听鼠标悬浮标注
      if (typeof this.onUnSelect === 'function') {
        eventEmitter.on(EInternalEvent.UnSelect, this.onUnSelect);
      }
    }

    public _onSelect = (annotation: any) => {
      if (this.drawing?.annotationMapping.has(annotation.id)) {
        this.onSelect(annotation);
      }
    };

    public destroy() {
      // @ts-ignore
      super.destroy();

      if (typeof this.onSelect === 'function') {
        eventEmitter.off(EInternalEvent.Select, this._onSelect);
      }

      if (typeof this.onUnSelect === 'function') {
        eventEmitter.off(EInternalEvent.UnSelect, this.onUnSelect);
      }
    }
  };
}
