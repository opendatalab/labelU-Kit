import { eventEmitter } from '../singletons';
import { EInternalEvent } from '../enums';
import { Pen } from './Pen';
import type { PointStyle } from '../shape';
// import type { PointData } from '../annotation/Point.annotation';
import { AnnotationPoint } from '../annotation/Point.annotation';

export class PointPen extends Pen<AnnotationPoint, PointStyle> {
  public select(annotation: AnnotationPoint) {
    const { style, hoveredStyle, selectedStyle } = this;

    if (this.draft) {
      this.draft.destroy();
    }

    this.draft = new AnnotationPoint(annotation.id, annotation.data, { ...style, ...selectedStyle }, hoveredStyle);
    // 绑定移动事件
    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
  }

  public unselect(_annotation: AnnotationPoint) {
    super.unselect();

    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
  }

  private _handleLeftMouseDown = (e: MouseEvent) => {
    console.log('selected Point', e);
  };

  private _handleMove = (e: MouseEvent) => {
    console.log('eeee', e);
  };
}
