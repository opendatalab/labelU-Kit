import { EInternalEvent } from '../enums';
import { eventEmitter } from '../singletons';

/**
 * 悬浮标注的装饰器
 *
 * @description
 * why? 因为可以节省在每个annotation当中都写一遍监听事件的代码
 *
 * 用于标注类，用于监听标注被鼠标选中事件；
 * 如果希望实现选中效果，必须在被装饰的类下面定义 onMouseOver 和 onHover 方法，且必须是箭头函数。
 *
 * @example
 * ```ts
 * @Selection
 * class AnnotationLine {
 *  onMouseOver = (annotation: AnnotationLine) => {
 *    // do something
 *  }
 *
 *  onHover = (annotation: AnnotationLine) => {
 *    // do something
 *  }
 * }
 */
export function Hover<T extends { new (...args: any[]): any }>(constructor: T) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);

      // 过滤鼠标经过的线条标注
      if (typeof this.onMouseOver === 'function') {
        eventEmitter.on(EInternalEvent.Move, this.onMouseOver);
      }

      // 监听鼠标悬浮标注
      if (typeof this.onHover === 'function') {
        eventEmitter.on(EInternalEvent.Hover, this.onHover);
      }
    }

    public destroy() {
      // @ts-ignore
      super.destroy();

      if (typeof this.onMouseOver === 'function') {
        eventEmitter.off(EInternalEvent.Select, this.onMouseOver);
      }

      if (typeof this.onHover === 'function') {
        eventEmitter.off(EInternalEvent.Hover, this.onHover);
      }
    }
  };
}
