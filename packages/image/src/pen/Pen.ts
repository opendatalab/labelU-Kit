import type { ILabel } from '@labelu/interface';

interface ITool {
  labelMapping: Map<string, ILabel>;
  // 其他属性和方法...
}

export class Pen<T extends ITool, ToolData> {
  public tool: T | null = null;

  /** 当前激活的标签类别 */
  public label: ILabel | undefined = undefined;
  /**
   * 绘制过程中的临时数据，并未真正添加到数据中
   */
  public draft: any;

  constructor(tool: T, label: ILabel | string) {
    this.tool = tool;

    if (typeof label === 'string') {
      const correctLabel = this.tool.labelMapping.get(label);

      if (!correctLabel) {
        throw new Error(`Label ${label} in ${tool} is not found!`);
      }

      this.label = correctLabel;
    } else {
      this.label = label;
    }
  }

  public makeData(): ToolData {
    console.log('makeData');
    return undefined as any;
  }

  /**
   * 设置激活的标签
   *
   * @param label 标签唯一标示
   */
  public setLabel(label: string) {
    const correctLabel = this.tool!.labelMapping.get(label);

    if (!correctLabel) {
      throw new Error(`Label ${label} in ${this.tool} is not found!`);
    }

    this.label = correctLabel;
  }

  render(ctx: CanvasRenderingContext2D) {
    console.log('render', ctx);
  }

  destroy(): void;
  destroy() {}
}
