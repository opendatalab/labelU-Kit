import type { EditType, ToolName } from '@/interface';
import type {
  CuboidToolOptions,
  LineToolOptions,
  PointToolOptions,
  PolygonToolOptions,
  RectToolOptions,
  RelationToolOptions,
} from '@/tools';

export interface AnnotatorOptions {
  container: HTMLDivElement;

  width: number;

  height: number;

  line?: LineToolOptions;

  point?: PointToolOptions;

  rect?: RectToolOptions;

  polygon?: PolygonToolOptions;

  cuboid?: CuboidToolOptions;

  relation?: RelationToolOptions;

  /**
   * 全局的是否可编辑设置，权重高于requestEdit函数
   *
   * @description 用于控制所有工具的编辑状态，如果禁用了编辑，requestEdit将不会被调用，鼠标指针为默认（cursor: default）状态
   * @default true
   */
  editable?: boolean;

  image: {
    url: string;
    rotate: number;
  };

  /**
   * 是否显示标注顺序
   *
   * @default false
   */
  showOrder?: boolean;

  /**
   * 标注线宽
   *
   * @default 2
   */
  strokeWidth?: number;

  /**
   * 标注填充不透明度
   *
   * @default 0.7
   */
  fillOpacity?: number;

  /**
   * 标注线不透明度
   *
   * @default 1
   */
  strokeOpacity?: number;

  requestEdit?: (
    type: EditType,
    payload: {
      toolName: ToolName;
      label?: string;
    },
  ) => boolean;
}

/**
 * 避免在AnnotatorBase或Annotator类中给属性成员传递自身的引用以降低复杂度，配置可单独作为模块导入
 */
export default class AnnotatorConfig {
  public container: HTMLDivElement;

  public width: number;

  public height: number;

  public line?: LineToolOptions;

  public point?: PointToolOptions;

  public rect?: RectToolOptions;

  public polygon?: PolygonToolOptions;

  public cuboid?: CuboidToolOptions;

  public relation?: RelationToolOptions;

  public editable?: boolean = true;

  public image: {
    url: string;
    rotate: number;
  };

  public showOrder?: boolean;

  public strokeWidth?: number;

  public fillOpacity?: number;

  public strokeOpacity?: number;

  public requestEdit?: (
    type: EditType,
    payload: {
      toolName: ToolName;
      label?: string;
    },
  ) => boolean;

  constructor(options: AnnotatorOptions) {
    this.container = options.container;
    this.width = options.width;
    this.height = options.height;
    this.line = options.line;
    this.point = options.point;
    this.relation = options.relation;
    this.rect = options.rect;
    this.polygon = options.polygon;
    this.cuboid = options.cuboid;
    this.editable = options.editable ?? true;
    this.image = options.image;
    this.showOrder = options.showOrder;
    this.strokeWidth = options.strokeWidth;
    this.fillOpacity = options.fillOpacity;
    this.strokeOpacity = options.strokeOpacity;
    this.requestEdit = options.requestEdit;
  }
}
