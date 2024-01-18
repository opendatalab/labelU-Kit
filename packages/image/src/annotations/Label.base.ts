import type { AttributeOption, ILabel } from '@labelu/interface';

import { DEFAULT_LABEL_COLOR, DEFAULT_LABEL_TEXT, DEFAULT_LABEL_VALUE } from '../constant';

/**
 * Label 基类
 */
export class LabelBase {
  static DEFAULT_COLOR = DEFAULT_LABEL_COLOR;

  static DEFAULT_LABEL_TEXT = DEFAULT_LABEL_TEXT;

  static DEFAULT_LABEL_VALUE = DEFAULT_LABEL_VALUE;

  public labelMapping: Map<string, ILabel> = new Map();

  private _labels: ILabel[];

  constructor(labels: ILabel[]) {
    this._labels = labels;
    // 创建标签映射
    this._createLabelMapping(labels);
  }

  private _createLabelMapping(labels: ILabel[] | undefined) {
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

  public getAttributeKeyText(labelValue?: string, value?: string): string {
    if (!value) {
      return '';
    }

    const label = this.getLabelByValue(labelValue);

    return label?.attributes?.find((attr) => attr.value === value)?.key || '';
  }

  public getAttributeValueText(
    labelValue: string | undefined,
    attributeKeyValue: string,
    attributeValue?: string | string[],
  ) {
    if (!attributeValue) {
      return '';
    }

    const label = this.getLabelByValue(labelValue);
    const correctAttribute = label?.attributes?.find((attribute) => attribute.value === attributeKeyValue);

    if (!correctAttribute) {
      return attributeValue;
    }

    if (correctAttribute.type !== 'array' && correctAttribute.type !== 'enum') {
      return attributeValue;
    }

    const optionMapping: Record<string, AttributeOption> = {};

    for (const option of correctAttribute.options ?? []) {
      optionMapping[option.value] = option;
    }

    if (correctAttribute.type === 'array') {
      return (attributeValue as string[]).map((v) => optionMapping[v]?.key).join(',');
    }

    if (correctAttribute.type === 'enum') {
      return optionMapping[attributeValue as string]?.key ?? attributeValue;
    }

    return attributeValue;
  }

  public getAttributeTexts(labelValue?: string, attribute?: Record<string, string | string[]>): string {
    const texts: string[] = [];
    Object.entries(attribute || {}).forEach(([key, attr]) => {
      const keyText = this.getAttributeKeyText(labelValue, key);
      const value = this.getAttributeValueText(labelValue, key, attr);
      texts.push(`${keyText}: ${value}`);
    });
    return texts.join('\n');
  }

  public getLabelTextWithAttributes(value?: string, attribute?: Record<string, string | string[]>): string {
    return `${this.getLabelText(value)}\n${this.getAttributeTexts(value, attribute)}`;
  }

  public getLabelText(value?: string): string {
    if (typeof value !== 'string') {
      throw new Error('Value is not a string');
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
