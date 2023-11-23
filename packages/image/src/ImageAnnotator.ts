import EventEmitter from 'eventemitter3';

import { Renderer } from './core/Renderer';
import { PointTool } from './tools';
import type { PointToolOptions } from './tools';
import type { LineToolOptions } from './tools/LineTool';
import { LineTool } from './tools/LineTool';
import type { CursorParams } from './graphics/Cursor';
import type { ImageOption } from './core/BackgroundRenderer';
import { BackgroundRenderer } from './core/BackgroundRenderer';
import { Axis } from './core/Axis';
import type { AnnotationTool, AnnotationToolData, ToolName } from './tools/interface';

export interface AnnotatorOptions {
  container: HTMLDivElement;
  width: number;
  height: number;

  /**
   * 鼠标光标
   *
   * @description 默认开启，使用默认光标样式
   * @default undefined
   */
  cursor?: CursorParams | false;
  line?: LineToolOptions;
  point?: PointToolOptions;
  image: ImageOption;
}

export class Annotator extends EventEmitter {
  public renderer: Renderer | null = null;

  public backgroundRenderer: BackgroundRenderer | null = null;

  private _config: AnnotatorOptions;

  private _tools: AnnotationTool[] = [];

  private _axis: Axis | null = null;

  /**
   * 用于内部模块通信
   *
   * @description 内部事件名称都以 `__[module]:[event]__` 的形式命名
   */
  private _event: EventEmitter = new EventEmitter();

  constructor(params: AnnotatorOptions) {
    super();

    const { container } = params;

    if (!container) {
      throw new Error('container is required');
    }

    this._config = params;

    this.init();
  }

  public get config() {
    return this._config;
  }

  public init() {
    // 添加鼠标光标
    this._initialContainer();
    this._initialAxis();
  }

  private _initialContainer() {
    const { container, width, height } = this._config;

    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.position = 'relative';
    container.style.cursor = 'none';

    this.renderer = new Renderer({ container, width, height });
    // 解决canvas绘制模糊问题
    this.renderer.ctx?.translate(-0.5, -0.5);
    this.renderer.canvas.style.position = 'absolute';
    this.renderer.canvas.style.left = '0';
    this.renderer.canvas.style.cursor = 'none';
    this.renderer.canvas.style.top = '0';
    this.renderer.canvas.style.zIndex = '2';

    this.backgroundRenderer = new BackgroundRenderer({ container, width, height });
    this.backgroundRenderer.canvas.style.position = 'absolute';
    this.backgroundRenderer.canvas.style.cursor = 'none';
    this.backgroundRenderer.canvas.style.left = '0';
    this.backgroundRenderer.canvas.style.top = '0';
    this.backgroundRenderer.canvas.style.zIndex = '1';
  }

  private _initialAxis() {
    if (!this.renderer) {
      return;
    }

    this._axis = new Axis(this);
    this.backgroundRenderer!.setAxis(this._axis!);
  }

  private _use(instance: AnnotationTool) {
    this._tools.push(instance);
    return this;
  }

  public get tools() {
    return this._tools;
  }

  public render() {
    const { renderer } = this;
    if (!renderer) {
      return this;
    }

    this._tools.forEach((tool) => {
      tool.render(renderer.ctx!);
    });
  }

  public loadImage(url: string, options: ImageOption) {
    return this.backgroundRenderer!.loadImage(url, options);
  }

  /**
   * 加载标注数据
   */
  public loadData<T extends ToolName>(toolName: T, data: AnnotationToolData<T>) {
    if (!data) {
      return;
    }

    const { _axis } = this;

    if (toolName == 'line') {
      this._use(
        new LineTool(
          {
            ...this._config.line,
            data: data as AnnotationToolData<'line'>,
          },
          _axis!,
        ),
      );
    } else if (toolName == 'point') {
      this._use(
        new PointTool(
          {
            ...this._config.point,
            data: data as AnnotationToolData<'point'>,
          },
          _axis!,
        ),
      );
    }

    this.render();
  }

  public destroy() {
    this.removeAllListeners();
    this._event!.removeAllListeners();
    this._tools.forEach((tool) => {
      tool.destroy();
    });
    this._tools = [];
    this._axis?.destroy();
    this._axis = null;
    this.renderer = null;
  }
}
