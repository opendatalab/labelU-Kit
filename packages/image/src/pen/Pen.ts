import { BaseLabel } from '../drawing/BaseLabel';

export class Pen<Annotation, Style> extends BaseLabel<Style> {
  /** 当前激活的标签类别 */
  public label: string | undefined;

  /**
   * 绘制过程中的临时数据，并未真正添加到数据中
   * Group<Line, LineStyle>
   */
  public draft: Annotation | null = null;

  /**
   * 标签分类的颜色所影响的canvas样式属性
   *
   * @default ['stroke']
   */
  public effectedStyles: string[] = ['stroke'];

  /**
   * 选中标注，创建草稿
   */
  public select(_annotation: Annotation) {
    console.error('Implement select method');
  }

  /**
   * 取消选中标注，销毁草稿
   */
  public unselect(_annotation?: Annotation): void;
  public unselect(): void {
    // TODO：完善类型
    // @ts-ignore
    this.draft?.destroy();
    this.draft = null;
  }

  public destroy() {
    // TODO：完善类型
    // @ts-ignore
    this.draft?.destroy();
  }

  render(ctx: CanvasRenderingContext2D) {
    const { draft } = this;
    if (draft) {
      // TODO 完善类型
      // @ts-ignore
      draft.render(ctx);
    }
  }
}
