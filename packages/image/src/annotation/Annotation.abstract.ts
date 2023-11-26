export abstract class Annotation<Data, Tool> {
  abstract data: Data;

  abstract tool: Tool;

  abstract id: string;

  abstract get isHovered(): boolean;
}
