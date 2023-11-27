import type { Annotation } from '../annotation/Annotation';

export interface IDrawing<Data, Tool> {
  data: Data[];

  tool: Tool;

  readonly annotationMapping: Map<string, Annotation<Data, Tool>>;

  render: (ctx: CanvasRenderingContext2D) => void;

  destroy: () => void;
}

export class Drawing<Data, Tool> implements IDrawing<Data, Tool> {
  public data: Data[] = [];

  public tool: Tool;

  public get annotationMapping() {
    console.log('Implement me!');
    return new Map();
  }

  constructor(data: Data[], tool: Tool) {
    this.data = data;
    this.tool = tool;
  }

  public render(_ctx: CanvasRenderingContext2D) {
    console.log('Implement me!');
  }

  public destroy() {
    this.data = [];
    this.tool = null as any;
  }
}
