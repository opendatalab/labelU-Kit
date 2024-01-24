import EventEmitter from 'eventemitter3';

import { axis, eventEmitter } from '../singletons';
import { EInternalEvent } from '../enums';
import type { AnnotationParams } from '../annotations/Annotation';
import type { BasicImageAnnotation, ToolName } from '../interface';
import type { AxisPoint, Shape } from '../shapes';
import { Point, Group, Spline, ClosedSpline } from '../shapes';
import { ControllerPoint } from './ControllerPoint';
import { ControllerEdge } from './ControllerEdge';
import { LabelBase } from '../annotations/Label.base';

type MouseEventHandler = (e: MouseEvent) => void;

export class Draft<
  Data extends BasicImageAnnotation,
  IShape extends Shape<Style>,
  Style extends Record<string, any>,
> extends EventEmitter {
  public isPicked = false;

  public config: any;

  public labelColor = LabelBase.DEFAULT_COLOR;

  public strokeColor = LabelBase.DEFAULT_COLOR;

  public name: ToolName;

  public id: string;

  public data: Data;

  public style: Style;

  public group: Group<IShape, Style>;

  public hoveredStyle?: Style | ((style: Style) => Style);

  public showOrder: boolean = false;

  private _onMoveHandlers: MouseEventHandler[] = [];

  private _onMouseDownHandlers: MouseEventHandler[] = [];

  private _onMouseUpHandlers: MouseEventHandler[] = [];

  private _serializeData: {
    id: string;
    order: number;
    shapes: {
      id: string;
    }[];
  } | null = null;

  constructor({ id, data, style, hoveredStyle, showOrder, name }: AnnotationParams<Data, Style> & { name: ToolName }) {
    super();

    this.name = name;
    this.id = id;
    this.data = data;
    this.style = style;
    this.hoveredStyle = hoveredStyle;
    this.showOrder = showOrder;

    this.group = new Group(id, data.order, true);

    // 应该让草稿内的图形对象先于草稿对象监听鼠标事件
    // TODO：模仿DOM的事件设计冒泡机制，处理重叠的图形鼠标事件
    setTimeout(() => {
      eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
      eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
      eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
      eventEmitter.on(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
    });
  }

  private _handleMouseDown = (e: MouseEvent) => {
    // 如果鼠标落在控制点或者控制边上，不选中草稿
    if (this._isControlUnderCursor({ x: e.offsetX, y: e.offsetY })) {
      return;
    }

    // 存在草稿说明当前处于编辑状态，只需要判断鼠标是否落在在草稿上即可
    if (this.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
      this.isPicked = true;
      this._serializeData = this.group.serialize();

      for (const handler of this._onMouseDownHandlers) {
        handler(e);
      }
    }
  };

  private _isControlUnderCursor(mouseCoord: AxisPoint) {
    const controls = this._getControls();

    for (const control of controls) {
      if (control.isUnderCursor(mouseCoord)) {
        return true;
      }
    }

    return false;
  }

  private _getControls() {
    const controls: (ControllerPoint | ControllerEdge)[] = [];

    const digDeep = (group: Group<Shape<Style>, Style>) => {
      for (const shape of group.shapes) {
        if (shape instanceof Group) {
          digDeep(shape as Group<Shape<Style>, Style>);
        } else if (shape instanceof ControllerPoint || shape instanceof ControllerEdge) {
          controls.push(shape);
        }
      }
    };

    digDeep(this.group);

    return controls;
  }

  private _handleMouseMove = (e: MouseEvent) => {
    const { _onMoveHandlers, isPicked } = this;

    if (!isPicked) {
      return;
    }

    // 统一在这里移动草稿
    this.moveByDistance();

    for (const handler of _onMoveHandlers) {
      handler(e);
    }
  };

  private _handleRightMouseUp = (e: MouseEvent) => {
    const isUnderCursor = this.isUnderCursor({ x: e.offsetX, y: e.offsetY });

    if (!isUnderCursor && !axis?.isMoved) {
      this.group.emit(EInternalEvent.UnSelect, e, this);
    }
  };

  private _handleLeftMouseUp = (e: MouseEvent) => {
    const { isPicked } = this;

    if (!isPicked) {
      return;
    }

    this.isPicked = false;
    this._serializeData = null;

    for (const handler of this._onMouseUpHandlers) {
      handler(e);
    }

    eventEmitter.emit('change');
  };

  private _digCoordinates(): AxisPoint[] | AxisPoint[][] {
    const loop = (shape: any): AxisPoint | AxisPoint[] => {
      if (shape.shapes) {
        return (shape as Group<Shape<Style>, Style>).shapes.map(loop) as AxisPoint[];
      } else {
        return shape.dynamicCoordinate;
      }
    };

    return (this._serializeData?.shapes?.map(loop) as AxisPoint[] | AxisPoint[][]) ?? [];
  }

  public onMove(handler: MouseEventHandler) {
    this._onMoveHandlers.push(handler);
  }

  public onMouseDown(handler: MouseEventHandler) {
    this._onMouseDownHandlers.push(handler);
  }

  public onMouseUp(handler: MouseEventHandler) {
    this._onMouseUpHandlers.push(handler);
  }

  /**
   * 获取组合除去控制点的包围盒
   *
   * @description 对于一些特殊的图形，比如圆，创建选框时在组内需要忽略半径
   */
  public getBBoxWithoutControllerPoint() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < this.group.shapes.length; i += 1) {
      const shape = this.group.shapes[i];

      if (shape instanceof Point) {
        continue;
      }

      minX = Math.min(minX, shape.bbox.minX);
      minY = Math.min(minY, shape.bbox.minY);
      maxX = Math.max(maxX, shape.bbox.maxX);
      maxY = Math.max(maxY, shape.bbox.maxY);
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
    };
  }

  public isUnderCursor(mouseCoord: AxisPoint) {
    // 线条 和 立体框 应该判定bbox在鼠标下
    if (this.name === 'line' || this.name === 'cuboid') {
      const bbox = this.getBBoxWithoutControllerPoint();

      return (
        mouseCoord.x >= bbox.minX && mouseCoord.x <= bbox.maxX && mouseCoord.y >= bbox.minY && mouseCoord.y <= bbox.maxY
      );
    }

    return Boolean(this.group.isShapesUnderCursor(mouseCoord));
  }

  /**
   * 根据鼠标移动的距离移动草稿
   */
  public moveByDistance() {
    const { config, _serializeData } = this;

    const [safeX, safeY] = config?.outOfImage ? [true, true] : axis!.isCoordinatesSafe(this._digCoordinates());

    // TODO: 消灭any
    const loop = (shape: Shape<Style>, index: number, serialized: any) => {
      if (shape instanceof Group) {
        (shape as Group<Shape<Style>, Style>).each((item, idx) => {
          loop(item, idx, serialized[index].shapes);
        });
      } else {
        shape.plainCoordinate.forEach((point, i) => {
          if (safeX) {
            shape.coordinate[i].x = axis!.getOriginalX(serialized[index].dynamicCoordinate[i].x + axis!.distance.x);
          }

          if (safeY) {
            shape.coordinate[i].y = axis!.getOriginalY(serialized[index].dynamicCoordinate[i].y + axis!.distance.y);
          }
        });

        if (shape instanceof Spline || shape instanceof ClosedSpline) {
          shape.plainControlPoints.forEach((point, i) => {
            if (safeX) {
              shape.controlPoints[i].x = axis!.getOriginalX(
                serialized[index].dynamicControlPoints[i].x + axis!.distance.x,
              );
            }

            if (safeY) {
              shape.controlPoints[i].y = axis!.getOriginalY(
                serialized[index].dynamicControlPoints[i].y + axis!.distance.y,
              );
            }
          });
        }
      }
    };

    // 更新草稿坐标
    this.group.each((shape, index) => {
      loop(shape, index, _serializeData?.shapes);
    });

    // 手动更新组合的包围盒
    this.group.update();
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 选中的标注需要在最上层
    this.group.render(ctx);
  }

  public clearHandlers() {
    this._onMoveHandlers = [];
    this._onMouseDownHandlers = [];
    this._onMouseUpHandlers = [];
  }

  public get bbox() {
    return this.group.bbox;
  }

  public destroy() {
    this.data = null as any;
    this.group.destroy();
    this.clearHandlers();

    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }
}
