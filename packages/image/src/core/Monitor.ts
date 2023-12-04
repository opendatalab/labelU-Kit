import { EInternalEvent } from '../enums';
import { eventEmitter, rbush } from '../singletons';
import type { AxisPoint } from '../shape';

/**
 * 画布监控器
 *
 * @description 用于监控画布的变化，包括画布的大小、缩放比例、偏移量等
 */
export class Monitor {
  private _canvas: HTMLCanvasElement;

  public _hoveredGroup: any = null;

  public selectedAnnotationId: string | null = null;

  private _orderIndexedAnnotationIds: string[] = [];

  private _isSelectedGroupHold = false;

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

    eventEmitter.on(EInternalEvent.RightMouseUpWithoutAxisChange, this._handleRightMouseUp);
  }

  private _handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
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

    this._isSelectedGroupHold = false;

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
    const { _hoveredGroup } = this;
    const rbushItems = this.scanCanvasObject({ x: e.offsetX, y: e.offsetY });
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
  public scanCanvasObject(mouseCoord: AxisPoint) {
    return rbush.search({
      minX: mouseCoord.x,
      minY: mouseCoord.y,
      maxX: mouseCoord.x,
      maxY: mouseCoord.y,
    });
  }

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

  public destroy() {
    const { _canvas } = this;

    _canvas.removeEventListener('mousedown', this._handleMouseDown);
    _canvas.removeEventListener('contextmenu', this._handleContextMenu);
    _canvas.removeEventListener('mousemove', this._handleMouseMove);
    _canvas.removeEventListener('mouseup', this._handleMouseUp);
    _canvas.removeEventListener('wheel', this._handleWheel);

    eventEmitter.off(EInternalEvent.RightMouseUpWithoutAxisChange, this._handleRightMouseUp);
  }
}
