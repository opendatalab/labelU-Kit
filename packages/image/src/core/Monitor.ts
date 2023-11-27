import type { BBox } from 'rbush';
import { v4 as uuid } from 'uuid';

import type { AnnotationLine, AnnotationPoint } from '../annotation';
import type { Annotator } from '../ImageAnnotator';
import { EInternalEvent } from '../enums';
import { Rect } from '../shape';
import { axis, eventEmitter, rbush } from '../singletons';

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

  private _bbox: BBox | null = null;

  private _selectionBBox: Rect | null = null;

  constructor(annotator: Annotator) {
    this._annotator = annotator;

    this._bindEvents();
  }

  @validateAxis
  private _bindEvents() {
    eventEmitter.on(EInternalEvent.Move, this._handleMouseOver.bind(this));
    eventEmitter.on(EInternalEvent.RightClick, this._handleRightClick.bind(this));
  }

  private _handleMouseOver(e: MouseEvent) {
    const { tools } = this._annotator;
    const hoveredAnnotations: (AnnotationLine | AnnotationPoint)[] = [];

    for (const tool of tools) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      tool.drawing?.annotationMapping.forEach((annotation) => {
        if (annotation.isHovered) {
          hoveredAnnotations[annotation.data.order] = annotation;
        }
      });
    }

    if (hoveredAnnotations.length > 0) {
      const lastAnnotation = hoveredAnnotations[hoveredAnnotations.length - 1];
      eventEmitter.emit(EInternalEvent.Hover, lastAnnotation);
      eventEmitter.emit('hover', e, lastAnnotation.data);
    }
  }

  private _handleRightClick(e: MouseEvent) {
    const { tools } = this._annotator;
    const hoveredAnnotations: (AnnotationLine | AnnotationPoint)[] = [];

    for (const tool of tools) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      tool.drawing?.annotationMapping.forEach((annotation) => {
        if (annotation.isHovered) {
          hoveredAnnotations[annotation.data.order] = annotation;
        }
      });
    }

    if (hoveredAnnotations.length > 0) {
      const lastAnnotation = hoveredAnnotations[hoveredAnnotations.length - 1];
      eventEmitter.emit(EInternalEvent.Select, lastAnnotation);
      eventEmitter.emit('select', e, lastAnnotation.data);
    } else {
      eventEmitter.emit(EInternalEvent.UnSelect);
      eventEmitter.emit('unselect', e);
    }
  }

  /**
   * 点击画布事件处理
   */
  @validateAxis
  private _onSelected() {
    const { _selectedAnnotation, _selectionBBox } = this;

    const bbox = _selectedAnnotation!.getBBox();
    console.log(rbush.all());

    if (_selectionBBox) {
      _selectionBBox.destroy();
      this._selectionBBox = null;
    }

    this._selectionBBox = new Rect(
      uuid(),
      axis!.getOriginalCoord({
        x: bbox.minX,
        y: bbox.minY,
      }),
      (bbox.maxX - bbox.minX) / axis!.scale,
      (bbox.maxY - bbox.minY) / axis!.scale,
      {
        stroke: '#fff',
        strokeWidth: 1,
      },
    );
    this._bbox = bbox;
  }

  public destroy() {
    eventEmitter.off(EInternalEvent.Move, this._handleMouseOver.bind(this));
    eventEmitter.off(EInternalEvent.Click, this._handleRightClick.bind(this));
  }

  public get annotator() {
    return this._annotator;
  }
}
