export interface CursorStyle {
  /** 线条颜色 */
  stroke?: string;

  /** 线条宽度 */
  strokeWidth?: number;

  /** 线条透明度 */
  opacity?: number;
}

export interface CursorParams {
  /** 起始点x坐标 */
  x: number;

  /** 起始点y坐标 */
  y: number;

  /** 线条样式 */
  style?: CursorStyle;
}

export class Cursor {
  public style: Required<CursorStyle> = {
    stroke: '#000',
    strokeWidth: 2,
    opacity: 1,
  };

  public coordinate: { x: number; y: number } = {
    x: 0,
    y: 0,
  };

  constructor(params: CursorParams) {
    this.coordinate = {
      x: params.x,
      y: params.y,
    };

    if (params.style) {
      this.style = params.style as Required<CursorStyle>;
    }
  }

  public updateCoordinate(x: number, y: number) {
    this.coordinate = {
      x,
      y,
    };
  }
}
