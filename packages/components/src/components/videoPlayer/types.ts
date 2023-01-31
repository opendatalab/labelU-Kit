export interface ITagLabelItem {
  keyLabel: string;
  valuesLabelArray: string[];
}

export type ITagLabelsArray = ITagLabelItem[];

export type ObjectString = Record<string, string | undefined>;
