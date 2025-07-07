import { config } from '@/singletons/annotationConfig';

import { EInternalEvent } from '../enums';
import { eventEmitter, rbush } from '../singletons';
import type { AnnotationShape, AnnotationTool, GroupInAnnotation, ToolName } from '../interface';
import { Group } from '../shapes';

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

export interface MonitorOption {
  getTools: () => Map<ToolName, AnnotationTool>;
}

/**
 * 画布监控器
 *
 * @description 用于监控画布的变化，包括画布的大小、缩放比例、偏移量等
 */
export class Monitor {
  private _canvas: HTMLCanvasElement;

  public hoveredGroup: GroupInAnnotation | null = null;

  public hoveredShape: AnnotationShape | null = null;

  public selectedAnnotationId: string | null = null;

  private _options: MonitorOption;

  // TODO: 清空标注时这里也要清空
  private _orderIndexedAnnotationIds: string[] = [];

  private _enabled: boolean = false;

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

  constructor(canvas: HTMLCanvasElement, options: MonitorOption) {
    if (!canvas) {
      throw Error('canvas is required');
    }

    this._canvas = canvas;
    this._options = options;
    this._enabled = true;

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
    eventEmitter.on('clear', this._handleClear);
  }

  private _handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private _handleKeyDown = (e: KeyboardEvent) => {
    // 输入类的元素不触发快捷键
    if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
      return;
    }

    if (e.key === ' ' || keyEventMapping[e.key as EventKeyName]) {
      e.preventDefault();
      this._updateKeyStatus(e.key, true);

      if (!config?.editable && e.key !== 'Space') {
        return;
      }

      eventEmitter.emit(keyEventMapping[e.key as EventKeyName], e);
    }

    eventEmitter.emit(EInternalEvent.KeyDown, e);
  };

  private _handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ' || keyEventMapping[e.key as EventKeyName]) {
      e.preventDefault();
      this._updateKeyStatus(e.key, false);
    }

    if (!config?.editable) {
      return;
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

    // 删除的标注后面的order往前移动
    const tools = this._options.getTools();
    let draftUpdated = false;
    for (let i = order; i < _orderIndexedAnnotationIds.length; i++) {
      const id = _orderIndexedAnnotationIds[i];

      if (!id) {
        continue;
      }

      for (const tool of tools.values()) {
        if (!tool.drawing?.has(id)) {
          continue;
        }

        const annotation = tool.drawing.get(id);

        if (!annotation) {
          throw Error(`Annotation: ${id} is not found`);
        }

        tool.updateOrder(id, i);

        if (tool.draft && !draftUpdated) {
          tool.draft.data.order -= 1;
          tool.rebuildDraft(tool.draft.data as any);
          draftUpdated = true;
        }
      }
    }

    tools.forEach((tool) => tool.refresh());
  };

  private _handleClear = () => {
    this._orderIndexedAnnotationIds = [];
  };

  private _handleMouseDown = (e: MouseEvent) => {
    if (!this._enabled) {
      return;
    }

    if (e.button === 0) {
      eventEmitter.emit(EInternalEvent.LeftMouseDown, e);
    } else if (e.button === 2) {
      eventEmitter.emit(EInternalEvent.RightMouseDown, e);
    }
  };

  private _handleMouseMove = (e: MouseEvent) => {
    if (!this._enabled) {
      return;
    }

    e.preventDefault();

    eventEmitter.emit(EInternalEvent.MouseMove, e);
    this._handleMouseOver(e);
  };

  private _handleMouseUp = (e: MouseEvent) => {
    if (!this._enabled) {
      return;
    }

    e.preventDefault();

    if (e.button === 0) {
      eventEmitter.emit(EInternalEvent.LeftMouseUp, e);
    } else if (e.button === 2) {
      eventEmitter.emit(EInternalEvent.RightMouseUp, e);
    }

    eventEmitter.emit('mouseup', e);
  };

  private _handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    eventEmitter.emit(EInternalEvent.Wheel, e);
  };

  /**
   * 全局处理鼠标移动事件
   * TODO: 消灭any
   * @description 用于处理鼠标移动到标注上时，触发标注的 hover 事件；同时，选中标注的逻辑也会依赖此处理函数
   */
  private _handleMouseOver = (e: MouseEvent) => {
    const { hoveredGroup, hoveredShape } = this;
    const rbushItems = rbush.scanCanvasObject({ x: e.offsetX, y: e.offsetY });
    const orderIndexedGroup: any[] = [];
    let topGroup: any | null = null;

    const oldHoveredShape = hoveredShape;

    for (const rbushItem of rbushItems) {
      if (rbushItem._group) {
        const isUnderCursor = rbushItem._group.isShapesUnderCursor({
          x: e.offsetX,
          y: e.offsetY,
        });

        // 隐藏的标注不触发事件
        if (isUnderCursor && rbushItem._group.shapes[0].style.opacity !== 0) {
          orderIndexedGroup[rbushItem._group.order] = rbushItem._group;

          // NOTE: 曲线的控制点是一个group，不是shape，单独处理
          // @ts-ignore
          if (rbushItem._group.IS_CONTROL) {
            topGroup = rbushItem._group;
            break;
          }

          if (rbushItem._group.isTop) {
            topGroup = rbushItem._group;
          }
        }
      } else if (rbushItem._shape && rbushItem._shape.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
        this.hoveredShape = rbushItem._shape as any;
      }
    }
    // 最后一个表示order最大的group
    const lastGroup = topGroup || orderIndexedGroup[orderIndexedGroup.length - 1];

    // 向group发送鼠标悬浮事件
    if (lastGroup) {
      lastGroup.emit(EInternalEvent.MouseOver, e);

      lastGroup.reverseEach((shape: any) => {
        // 曲线的slopeEdge是一个group，不是shape
        if (shape instanceof Group) {
          shape.reverseEach((innerShape: any) => {
            if (innerShape.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
              innerShape.emit(EInternalEvent.ShapeOver, e, innerShape);

              if (hoveredShape && hoveredShape.id !== innerShape.id) {
                hoveredShape.emit(EInternalEvent.ShapeOut, e, hoveredShape);
              }

              this.hoveredShape = innerShape;
              // 只给一个shape发送事件，避免多个shape同时hover
              return false;
            }
          });
          return false;
        } else if (shape.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
          shape.emit(EInternalEvent.ShapeOver, e, shape);

          this.hoveredShape = shape;
          // 只给一个shape发送事件，避免多个shape同时hover
          return false;
        }
      });

      if (hoveredGroup && hoveredGroup.id !== lastGroup.id) {
        // 向上一次hover的group发送鼠标离开事件，避免多个group同时hover
        hoveredGroup.emit(EInternalEvent.MouseOut, e);
      }

      if (oldHoveredShape && oldHoveredShape.id !== this.hoveredShape?.id) {
        oldHoveredShape.emit(EInternalEvent.ShapeOut, e, oldHoveredShape);
      }

      this.hoveredGroup = lastGroup;

      for (const rbushItem of rbushItems) {
        if (rbushItem._group && lastGroup.id !== rbushItem._group.id) {
          // 向其他group发送鼠标离开事件
          rbushItem._group.emit(EInternalEvent.MouseOut, e);
          rbushItem._group.each((shape) => {
            shape.emit(EInternalEvent.ShapeOut, e);
          });
        }
      }
    } else {
      eventEmitter.emit(EInternalEvent.NoTarget, e);

      if (this.hoveredShape) {
        this.hoveredShape.emit(EInternalEvent.ShapeOver, e, this.hoveredShape);
      }

      if (oldHoveredShape && !oldHoveredShape.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
        oldHoveredShape.emit(EInternalEvent.ShapeOut, e, oldHoveredShape);
        this.hoveredShape = null;
      }

      rbush.nearestPoint?.destroy();
      rbush.nearestPoint = null;
      this.hoveredGroup = null;
    }
  };

  /**
   * 获取键盘状态
   */
  public get keyboard() {
    return this._keyStatus;
  }

  public disable() {
    this._enabled = false;
  }

  public enable() {
    this._enabled = true;
  }

  /**
   * 处理全局的右键事件
   *
   * @description 右键点击选中和取消选中标注
   */
  private _handleRightMouseUp = (e: MouseEvent) => {
    if (!config?.editable) {
      return;
    }

    const { hoveredGroup, selectedAnnotationId } = this;

    if (hoveredGroup) {
      if (selectedAnnotationId && hoveredGroup.id !== selectedAnnotationId) {
        this.selectedAnnotationId = null;
      }

      hoveredGroup.emit(EInternalEvent.Select, e);
      this.selectedAnnotationId = hoveredGroup.id;
    }

    eventEmitter.emit('rightClick', e, hoveredGroup?.id);
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
    eventEmitter.off('delete', this._updateOrderIndexedAnnotationIds);
    eventEmitter.off('clear', this._handleClear);
  }
}
