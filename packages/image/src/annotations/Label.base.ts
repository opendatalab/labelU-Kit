import { type ILabel } from '@labelu/interface';

/**
 * Label 基类
 */
export class LabelBase {
  static DEFAULT_COLOR = '#000';

  static DEFAULT_LABEL_TEXT = '无标签';

  static DEFAULT_LABEL_VALUE = 'noneAttribute';

  public labelMapping: Map<string, ILabel> = new Map();

  private _labels: ILabel[];

  constructor(labels: ILabel[]) {
    this._labels = labels;
    // 创建标签映射
    this._createLabelMapping(labels);
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
      throw Error('value is not a string', value);
    }

    return this.labelMapping.get(value);
  }

  public getLabelText(value: string | undefined) {
    if (typeof value !== 'string') {
      throw Error('value is not a string', value);
    }

    return this.getLabelByValue(value)?.key ?? LabelBase.DEFAULT_LABEL_TEXT;
  }

  public getLabelColor(value: string | undefined) {
    if (!value) {
      return LabelBase.DEFAULT_COLOR;
    }

    return this.getLabelByValue(value)?.color ?? LabelBase.DEFAULT_COLOR;
  }

  public get labels() {
    return this._labels;
  }
}
