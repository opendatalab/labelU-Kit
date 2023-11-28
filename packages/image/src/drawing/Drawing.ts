import type { ILabel } from '@labelu/interface';

import type { BasicImageAnnotation } from '../interface';
import type { Annotation } from '../annotation/Annotation';
import { BaseLabel } from './BaseLabel';

export class Drawing<Data extends BasicImageAnnotation, Style> extends BaseLabel<Style> {
  private _annotationMapping: Map<string, Annotation<Data, Style>> = new Map();

  data: Data[];

  constructor(data: Data[], labels: ILabel[], style: Style, hoveredStyle: Style, selectedStyle: Style) {
    super(labels, style, hoveredStyle, selectedStyle);

    this.data = data;
  }

  public remove(annotation: Annotation<Data, Style>) {
    this._annotationMapping.delete(annotation.id);
    annotation.destroy();
  }

  public get annotationMapping() {
    return this._annotationMapping;
  }

  addAnnotation(_data: Data) {
    console.error('Implement me!');
  }

  public render(_ctx: CanvasRenderingContext2D) {
    console.log('Implement me!');
  }

  public destroy() {
    this.data = [];

    this.annotationMapping.forEach((element) => {
      element.destroy();
    });

    this.annotationMapping.clear();
  }
}
