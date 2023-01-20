export interface IBaseColorStyle {
  stroke: string;
  fill: string;
}

export interface IToolColorStyle {
  valid: IBaseColorStyle;
  invalid: IBaseColorStyle;
  validSelected: IBaseColorStyle;
  invalidSelected: IBaseColorStyle;
  validHover: IBaseColorStyle;
  invalidHover: IBaseColorStyle;
  validTextColor: string;
  invalidTextColor: string;
}
