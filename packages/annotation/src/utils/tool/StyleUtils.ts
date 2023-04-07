export default class StyleUtils {
  /**
   * Transformer Style to String
   * @param style
   * @returns
   */
  public static getStyle2String(style?: StyleSheetList) {
    if (!style) {
      return;
    }

    return Object.entries(style).reduce((acc, cur) => `${acc} ${cur[0]}: ${cur[1]};`, '');
  }
}
