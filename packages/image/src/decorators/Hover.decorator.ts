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
      eventEmitter.on(EInternalEvent.Move, this._onMove);

      // 监听鼠标悬浮标注
      eventEmitter.on(EInternalEvent.Hover, this._onHover);
    }

    public _onMove = (...args: any[]) => {
      if (typeof this.onMouseOver === 'function') {
        this.onMouseOver(...args);
      }
    };

    public _onHover = (...args: any[]) => {
      if (typeof this.onMouseOver === 'function') {
        this.onHover(...args);
      }
    };

    public destroy() {
      super.destroy();

      eventEmitter.off(EInternalEvent.Move, this._onMove);
      eventEmitter.off(EInternalEvent.Hover, this._onHover);
    }
  };
}
