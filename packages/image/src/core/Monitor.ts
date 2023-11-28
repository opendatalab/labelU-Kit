import type { BBox } from 'rbush';

import type { AnnotationLine, AnnotationPoint } from '../annotation';
import type { Annotator } from '../ImageAnnotator';
import { EInternalEvent } from '../enums';
import { eventEmitter } from '../singletons';

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

  private _selectedAnnotation: AnnotationLine | AnnotationPoint | null = null;

  constructor(annotator: Annotator) {
    this._annotator = annotator;

    this._bindEvents();
  }

  @validateAxis
  private _bindEvents() {
    eventEmitter.on(EInternalEvent.Move, this._handleMouseOver);
    eventEmitter.on(EInternalEvent.RightClick, this._handleRightClick);
  }

  private _handleMouseOver = (e: MouseEvent) => {
    const { tools } = this._annotator;
    const hoveredAnnotations: (AnnotationLine | AnnotationPoint)[] = [];

    for (const tool of tools) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      tool.drawing?.annotationMapping.forEach((annotation) => {
        if (annotation.isHovered) {
          // TODO: 类型修正
          // @ts-ignore
          hoveredAnnotations[annotation.data.order] = annotation;
        }
      });
    }

    if (hoveredAnnotations.length > 0) {
      const lastAnnotation = hoveredAnnotations[hoveredAnnotations.length - 1];
      eventEmitter.emit(EInternalEvent.Hover, lastAnnotation);
      eventEmitter.emit('hover', e, lastAnnotation.data);
    }
  };

  private _handleRightClick = (e: MouseEvent) => {
    const { _selectedAnnotation } = this;
    const { tools } = this._annotator;
    const hoveredAnnotations: (AnnotationLine | AnnotationPoint)[] = [];

    for (const tool of tools) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      tool.drawing?.annotationMapping.forEach((annotation) => {
        if (annotation.isHovered) {
          // TODO: 类型修正
          // @ts-ignore
          hoveredAnnotations[annotation.data.order] = annotation;
        }
      });
    }

    if (hoveredAnnotations.length > 0) {
      const lastAnnotation = hoveredAnnotations[hoveredAnnotations.length - 1];

      if (_selectedAnnotation && lastAnnotation.id !== _selectedAnnotation?.id) {
        eventEmitter.emit(EInternalEvent.UnSelect, _selectedAnnotation);
        eventEmitter.emit('unselect', e, lastAnnotation.data);
      }

      eventEmitter.emit(EInternalEvent.Select, lastAnnotation);
      eventEmitter.emit('select', e, lastAnnotation.data);
      this._selectedAnnotation = lastAnnotation;
    } else {
      eventEmitter.emit(EInternalEvent.UnSelect);
    }
  };

  public destroy() {
    eventEmitter.off(EInternalEvent.Move, this._handleMouseOver);
    eventEmitter.off(EInternalEvent.Click, this._handleRightClick);
  }

  public get annotator() {
    return this._annotator;
  }
}
