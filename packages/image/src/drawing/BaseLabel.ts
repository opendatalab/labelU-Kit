import type { ILabel } from '@labelu/interface';
/**
 * 工具基类
 */
export class BaseLabel<Style> {
  public defaultColor = '#000';

  public labelMapping = new Map();

  public style = {} as Required<Style>;

  public hoveredStyle = {} as Style;

  public selectedStyle = {} as Style;

  constructor(labels: ILabel[] | undefined, style: Style, hoveredStyle: Style, selectedStyle: Style) {
    // 创建标签映射
    this._createLabelMapping(labels);

    if (style) {
      this.style = {
        ...this.style,
        ...style,
      };
    }

    if (hoveredStyle) {
      this.hoveredStyle = hoveredStyle;
    }

    if (selectedStyle) {
      this.selectedStyle = selectedStyle;
    }
  }

  _createLabelMapping(labels: ILabel[] | undefined) {
    if (!labels) {
      return;
    }

    for (const label of labels) {
      this.labelMapping.set(label.value, label);
    }
  }

  public getLabelByValue(value: string | undefined) {
    if (typeof value !== 'string') {
      console.warn('value is not a string', value);
      return undefined;
    }

    return this.labelMapping.get(value);
  }

  public getLabelColor(label: string | undefined) {
    if (!label) {
      return this.defaultColor;
    }

    return this.getLabelByValue(label)?.color ?? this.defaultColor;
  }
}
