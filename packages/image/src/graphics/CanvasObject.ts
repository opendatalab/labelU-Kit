/**
 * 画布上的图形对象（基类）
 */
export class CanvasObject<Style, Coord> {
  /**
   * 图形对象的唯一标识
   */
  public id: string = '';

  /**
   * 图形对象的坐标
   */
  public coordinate: Coord;

  /**
   * 样式
   */
  public style: Style = {} as Style;

  constructor(id: string, coordinate: Coord) {
    this.id = id;

    this.coordinate = coordinate;
  }

  /**
   * 渲染图形
   * @param ctx canvas context
   */
  public render(ctx: CanvasRenderingContext2D | null): void;
  public render() {}
}
