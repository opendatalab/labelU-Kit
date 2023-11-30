import type { AnnotationLine, AnnotationPoint } from '../annotation';
import type { Annotator } from '../ImageAnnotator';
import { EInternalEvent } from '../enums';
import { eventEmitter, rbush } from '../singletons';
import type { AxisPoint } from '../shape';

function validateAxis(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const _this = this as Monitor;

    if (!_this.annotator) {
      throw new Error('Error: annotator is not defined.');
    }

    return originalMethod.apply(this, args);
  };
}

/**
 * 画布监控器
 *
 * @description 用于监控画布的变化，包括画布的大小、缩放比例、偏移量等
 */
export class Monitor {
  private _annotator: Annotator;

  private _hoveredGroup: any = null;

  private _selectedAnnotation: AnnotationLine | AnnotationPoint | null = null;

  constructor(annotator: Annotator) {
    this._annotator = annotator;

    this._bindEvents();
  }

  @validateAxis
  private _bindEvents() {
    eventEmitter.on(EInternalEvent.Move, this._handleMouseOver);
    eventEmitter.on(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
  }

  /**
   * 全局处理鼠标移动事件
   *
   * @description 用于处理鼠标移动到标注上时，触发标注的 hover 事件；同时，选中标注的逻辑也会依赖此处理函数
   */
  private _handleMouseOver = (e: MouseEvent) => {
    const { _hoveredGroup } = this;
    const rbushItems = this._scanCanvasObject({ x: e.offsetX, y: e.offsetY });
    const orderIndexedGroup: any[] = [];

    for (const rbushItem of rbushItems) {
      if (rbushItem._group) {
        const isUnderCursor = rbushItem._group.isShapesUnderCursor({
          x: e.offsetX,
          y: e.offsetY,
        });

        if (isUnderCursor) {
          orderIndexedGroup[rbushItem._group.order] = rbushItem._group;
        }
      }
    }
    // 最后一个表示order最大的group
    const lastGroup = orderIndexedGroup[orderIndexedGroup.length - 1];

    // 向group发送鼠标悬浮事件
    if (lastGroup) {
      lastGroup.emit(EInternalEvent.BBoxOver, e);

      if (_hoveredGroup && _hoveredGroup.id !== lastGroup.id) {
        // 向上一次hover的group发送鼠标离开事件，避免多个group同时hover
        _hoveredGroup.emit(EInternalEvent.BBoxOut, e);
      }

      this._hoveredGroup = lastGroup;
    } else {
      eventEmitter.emit(EInternalEvent.NoTarget, e);
      this._hoveredGroup = null;

      return;
    }

    for (const rbushItem of rbushItems) {
      if (rbushItem._group && lastGroup.id !== rbushItem._group.id) {
        // 向其他group发送鼠标离开事件
        rbushItem._group.emit(EInternalEvent.BBoxOut, e);
      }
    }
  };

  private _handleLeftMouseDown(e: MouseEvent) {
    console.log('ddddd', e);
  }

  /**
   * 处理全局的右键事件
   *
   * @description 右键点击选中和取消选中标注
   */
  private _handleRightMouseUp = (e: MouseEvent, isMoved: boolean) => {
    // 移动了画布，不触发右键事件处理
    if (isMoved) {
      return;
    }
    const { _hoveredGroup, _selectedAnnotation } = this;

    if (_hoveredGroup) {
      if (_selectedAnnotation && _hoveredGroup.id !== _selectedAnnotation?.id) {
        eventEmitter.emit(EInternalEvent.UnSelect, _selectedAnnotation);
        eventEmitter.emit('unselect', e, _selectedAnnotation.data);
      }

      eventEmitter.emit(EInternalEvent.Select, _hoveredGroup);
      eventEmitter.emit('select', e, _hoveredGroup.data);
      this._selectedAnnotation = _hoveredGroup;
    } else if (_selectedAnnotation) {
      eventEmitter.emit(EInternalEvent.UnSelect, _selectedAnnotation);
      eventEmitter.emit('unselect', e, _selectedAnnotation.data);
    }
  };

  /**
   * 扫描鼠标经过画布内的图形元素，触发move事件
   *
   * @description
   *
   * 1. 首先通过鼠标坐标，从 R-Tree 中搜索出所有可能的图形元素
   * 2. 从id中取得映射的图形元素
   * 3. 根据图形类别，判断鼠标是否真实落在图形上
   * @param e
   */
  private _scanCanvasObject(mouseCoord: AxisPoint) {
    return rbush.search({
      minX: mouseCoord.x,
      minY: mouseCoord.y,
      maxX: mouseCoord.x,
      maxY: mouseCoord.y,
    });
  }

  public destroy() {
    eventEmitter.off(EInternalEvent.Move, this._handleMouseOver);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
  }

  public get annotator() {
    return this._annotator;
  }
}
