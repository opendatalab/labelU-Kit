export abstract class Drawing<Data, Tool, Annotation> {
  abstract data: Data[];

  abstract tool: Tool;

  abstract render(ctx: CanvasRenderingContext2D): void;

  abstract destroy(): void;

  abstract get annotationMapping(): Map<string, Annotation>;

  abstract get pointAnnotationMapping(): Map<string, string>;
}
