import { EInternalEvent } from '../enums';
import { eventEmitter, rbush } from '../singletons';
import type { AnnotationShape, GroupInAnnotation } from '../interface';

const keyEventMapping = {
  Space: EInternalEvent.Space,
  Shift: EInternalEvent.Shift,
  Alt: EInternalEvent.Alt,
  Control: EInternalEvent.Control,
  Backspace: EInternalEvent.BackSpace,
  Delete: EInternalEvent.Delete,
  Escape: EInternalEvent.Escape,
  Meta: EInternalEvent.Meta,
};

type EventKeyName = keyof typeof keyEventMapping;

/**
 * 画布监控器
 *
 * @description 用于监控画布的变化，包括画布的大小、缩放比例、偏移量等
 */
export class Monitor {
  private _canvas: HTMLCanvasElement;

  public _hoveredGroup: GroupInAnnotation | null = null;

  private _hoveredShape: AnnotationShape | null = null;

  public selectedAnnotationId: string | null = null;

  private _orderIndexedAnnotationIds: string[] = [];

  /** 键盘按键记录 */
  private _keyStatus: Record<EventKeyName, boolean> = {
    Space: false,
    Shift: false,
    Alt: false,
    Control: false,
    Backspace: false,
    Delete: false,
    Meta: false,
    Escape: false,
  };

  constructor(canvas: HTMLCanvasElement) {
    if (!canvas) {
      throw Error('canvas is required');
    }

    this._canvas = canvas;

    this._bindEvents();
  }

  private _bindEvents() {
    const { _canvas } = this;
    /**
     * NOTE: 画布元素的事件监听都应该在这里绑定，而不是在分散具体的工具中绑定
     */
    _canvas.addEventListener('mousedown', this._handleMouseDown, false);
    _canvas.addEventListener('contextmenu', this._handleContextMenu, false);
    _canvas.addEventListener('mousemove', this._handleMouseMove, false);
    _canvas.addEventListener('mouseup', this._handleMouseUp, false);
    _canvas.addEventListener('wheel', this._handleWheel, false);
    document.addEventListener('keydown', this._handleKeyDown, false);
    document.addEventListener('keyup', this._handleKeyUp, false);

    eventEmitter.on(EInternalEvent.RightMouseUpWithoutAxisChange, this._handleRightMouseUp);
    eventEmitter.on('delete', this._updateOrderIndexedAnnotationIds);
  }

  private _handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private _handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ' || keyEventMapping[e.key as EventKeyName]) {
      e.preventDefault();
      this._updateKeyStatus(e.key, true);
      eventEmitter.emit(keyEventMapping[e.key as EventKeyName], e);
    }

    eventEmitter.emit(EInternalEvent.KeyDown, e);
  };

  private _handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ' || keyEventMapping[e.key as EventKeyName]) {
      e.preventDefault();
      this._updateKeyStatus(e.key, false);
    }

    eventEmitter.emit(EInternalEvent.KeyUp, e);
  };

  private _updateKeyStatus(key: string, value: boolean) {
    if (key === ' ') {
      this._keyStatus.Space = value;
    } else {
      this._keyStatus[key as EventKeyName] = value;
    }
  }

  private _updateOrderIndexedAnnotationIds = (data: any) => {
    const { _orderIndexedAnnotationIds } = this;
    const { order } = data;

    if (order === undefined) {
      return;
    }

    _orderIndexedAnnotationIds.splice(order, 1);
  };

  private _handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      eventEmitter.emit(EInternalEvent.LeftMouseDown, e);
    } else if (e.button === 2) {
      eventEmitter.emit(EInternalEvent.RightMouseDown, e);
    }
  };

  private _handleMouseMove = (e: MouseEvent) => {
    e.preventDefault();

    eventEmitter.emit(EInternalEvent.MouseMove, e);
    this._handleMouseOver(e);
  };

  private _handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();

    if (e.button === 0) {
      eventEmitter.emit(EInternalEvent.LeftMouseUp, e);
    } else if (e.button === 2) {
      eventEmitter.emit(EInternalEvent.RightMouseUp, e);
    }
  };

  private _handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    eventEmitter.emit(EInternalEvent.Wheel, e);
  };

  /**
   * 全局处理鼠标移动事件
   *
   * @description 用于处理鼠标移动到标注上时，触发标注的 hover 事件；同时，选中标注的逻辑也会依赖此处理函数
   */
  private _handleMouseOver = (e: MouseEvent) => {
    const { _hoveredGroup, _hoveredShape } = this;
    const rbushItems = rbush.scanCanvasObject({ x: e.offsetX, y: e.offsetY });
    const orderIndexedGroup: GroupInAnnotation[] = [];

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

      lastGroup.reverseEach((shape: any) => {
        if (shape.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
          shape.emit(EInternalEvent.ShapeOver, e, shape);
          this._hoveredShape = shape;
          // 只给一个shape发送事件，避免多个shape同时hover
          return false;
        }
      });

      if (_hoveredGroup && _hoveredGroup.id !== lastGroup.id) {
        // 向上一次hover的group发送鼠标离开事件，避免多个group同时hover
        _hoveredGroup.emit(EInternalEvent.BBoxOut, e);
      }

      if (_hoveredShape && _hoveredShape.id !== this._hoveredShape?.id) {
        _hoveredShape.emit(EInternalEvent.ShapeOut, e, _hoveredShape);
      }

      this._hoveredGroup = lastGroup;
    } else {
      eventEmitter.emit(EInternalEvent.NoTarget, e);

      if (_hoveredShape) {
        _hoveredShape.emit(EInternalEvent.ShapeOut, e, _hoveredShape);
        this._hoveredShape = null;
      }

      this._hoveredGroup = null;

      return;
    }

    for (const rbushItem of rbushItems) {
      if (rbushItem._group && lastGroup.id !== rbushItem._group.id) {
        // 向其他group发送鼠标离开事件
        rbushItem._group.emit(EInternalEvent.BBoxOut, e);
        rbushItem._group.each((shape) => {
          shape.emit(EInternalEvent.ShapeOut, e);
        });
      }
    }
  };

  /**
   * 获取键盘状态
   */
  public get keyboard() {
    return this._keyStatus;
  }

  /**
   * 处理全局的右键事件
   *
   * @description 右键点击选中和取消选中标注
   */
  private _handleRightMouseUp = (e: MouseEvent) => {
    const { _hoveredGroup, selectedAnnotationId } = this;

    if (_hoveredGroup) {
      if (selectedAnnotationId && _hoveredGroup.id !== selectedAnnotationId) {
        eventEmitter.emit(EInternalEvent.UnSelect, e, selectedAnnotationId);
      }

      eventEmitter.emit(EInternalEvent.Select, e, _hoveredGroup.id);
      this.selectedAnnotationId = _hoveredGroup.id;
    } else if (selectedAnnotationId) {
      eventEmitter.emit(EInternalEvent.UnSelect, e, selectedAnnotationId);
    }
  };

  public setSelectedAnnotationId(id: string | null) {
    this.selectedAnnotationId = id;
  }

  public setOrderIndexedAnnotationIds(order: number, id: string) {
    if (typeof order !== 'number') {
      throw Error('order must be a number');
    }

    if (typeof id !== 'string') {
      throw Error('id must be a string');
    }

    this._orderIndexedAnnotationIds[order] = id;
  }

  public getMaxOrder() {
    if (this._orderIndexedAnnotationIds.length === 0) {
      return 0;
    }

    return this._orderIndexedAnnotationIds.length - 1;
  }

  public getNextOrder() {
    return this.getMaxOrder() + 1;
  }

  public destroy() {
    const { _canvas } = this;

    _canvas.removeEventListener('mousedown', this._handleMouseDown);
    _canvas.removeEventListener('contextmenu', this._handleContextMenu);
    _canvas.removeEventListener('mousemove', this._handleMouseMove);
    _canvas.removeEventListener('mouseup', this._handleMouseUp);
    _canvas.removeEventListener('wheel', this._handleWheel);
    document.removeEventListener('keydown', this._handleKeyDown);
    document.removeEventListener('keyup', this._handleKeyUp);

    eventEmitter.off(EInternalEvent.RightMouseUpWithoutAxisChange, this._handleRightMouseUp);
  }
}
