import { Renderer } from './core/Renderer';
import type { PointToolOptions, RectToolOptions } from './tools';
import { PointTool, RectTool } from './tools';
import type { LineToolOptions } from './tools/Line.tool';
import { LineTool } from './tools/Line.tool';
import type { CursorParams } from './shapes/Cursor.shape';
import type { ImageOption } from './core/BackgroundRenderer';
import { BackgroundRenderer } from './core/BackgroundRenderer';
import type { Axis } from './core/Axis';
import type { AnnotationTool, AnnotationToolData, ToolName } from './interface';
import { EInternalEvent } from './enums';
import type { Monitor } from './core/Monitor';
import { createAxis } from './singletons/axis';
import { createMonitor, eventEmitter } from './singletons';
import type { PolygonToolOptions } from './tools/Polygon.tool';
import { PolygonTool } from './tools/Polygon.tool';

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
  rect?: RectToolOptions;
  polygon?: PolygonToolOptions;
  image: ImageOption;
}

export class Annotator {
  public renderer: Renderer | null = null;

  public backgroundRenderer: BackgroundRenderer | null = null;

  public activeToolName: ToolName | null = null;

  private _monitor: Monitor | null = null;

  private _config: AnnotatorOptions;

  private _tools: Map<ToolName, AnnotationTool> = new Map();

  private _axis: Axis | null = null;

  /**
   * 用于外部模块通信
   *
   * @description 注意：不要与内部事件混淆
   */
  private _event: typeof eventEmitter = eventEmitter;

  constructor(params: AnnotatorOptions) {
    const { container } = params;

    if (!container) {
      throw new Error('container is required');
    }

    this._config = params;

    this._init();
    this.render();
  }

  public get config() {
    return this._config;
  }

  public _init() {
    // 添加鼠标光标
    this._initialContainer();
    this._initialAxis();
    this._monitor = createMonitor(this.renderer!.canvas);

    eventEmitter.on(EInternalEvent.ToolChange, this._handleToolChange);

    // debug
    // @ts-ignore
    window.monitor = this._monitor;
    window.annotator = this;
  }

  private _initialContainer() {
    const { container, width, height } = this._config;

    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.position = 'relative';
    container.style.cursor = 'none';

    this.renderer = new Renderer({ container, width, height });
    this.renderer.canvas.style.position = 'absolute';
    this.renderer.canvas.style.width = `${width}px`;
    this.renderer.canvas.style.height = `${height}px`;
    this.renderer.canvas.style.left = '0';
    this.renderer.canvas.style.cursor = 'none';
    this.renderer.canvas.style.top = '0';
    this.renderer.canvas.style.zIndex = '2';

    this.backgroundRenderer = new BackgroundRenderer({ container, width, height });
    this.backgroundRenderer.canvas.style.position = 'absolute';
    this.backgroundRenderer.canvas.style.width = `${width}px`;
    this.backgroundRenderer.canvas.style.height = `${height}px`;
    this.backgroundRenderer.canvas.style.cursor = 'none';
    this.backgroundRenderer.canvas.style.left = '0';
    this.backgroundRenderer.canvas.style.top = '0';
    this.backgroundRenderer.canvas.style.zIndex = '1';
  }

  private _initialAxis() {
    if (!this.renderer) {
      return;
    }

    this._axis = createAxis({
      renderer: this.renderer,
      cursor: this._config.cursor,
    });
    eventEmitter.on(EInternalEvent.Render, this.render);
  }

  private _handleToolChange = (toolName: ToolName, label: string) => {
    this.emit('toolChange', toolName, label);
    this.switch(toolName, label);
  };

  public get monitor() {
    return this._monitor;
  }

  public rotate(angle: number) {
    const { backgroundRenderer } = this;

    // TODO：有标注数据时不可旋转

    if (!backgroundRenderer) {
      throw new Error('backgroundRenderer is not initialized');
    }

    backgroundRenderer.clear();
    backgroundRenderer.rotate(angle);
  }

  public use(instance: AnnotationTool) {
    const { _tools } = this;
    if (_tools.has(instance.name)) {
      throw new Error(`Tool ${instance.name} already exists!`);
    }

    _tools.set(instance.name, instance);

    return this;
  }

  public get tools() {
    return Array.from(this._tools.values());
  }

  /**
   * 使工具进入绘制状态
   *
   * @example
   *
   * @param toolName 工具名称
   * @param label 标注类别，如果是字符串，则表示标注类别value（唯一标示）；如果是对象，则表示标注类别
   */
  public switch(toolName: ToolName, label: string) {
    if (typeof toolName !== 'string') {
      throw new Error('toolName must be string, such as "line" or "point"');
    }

    const { activeToolName } = this;
    const tool = this._tools.get(toolName);

    if (!tool) {
      // TODO：导向到文档
      throw new Error(`Tool ${toolName} is not used!`);
    }

    if (activeToolName && activeToolName !== toolName) {
      this._tools.get(activeToolName)!.deactivate();
    }

    this.activeToolName = toolName;
    tool.activate(label);
  }

  public render = () => {
    const { renderer, backgroundRenderer, _tools } = this;

    if (!renderer) {
      return this;
    }

    // 清除画布
    renderer.clear();
    // 清除背景
    backgroundRenderer!.clear();

    // 渲染背景
    backgroundRenderer!.render();

    // 渲染工具
    _tools.forEach((tool) => {
      tool.render(renderer!.ctx!);
    });
  };

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

    if (toolName == 'line') {
      this.use(
        new LineTool({
          ...this._config.line,
          data: LineTool.convertToCanvasCoordinates(data as AnnotationToolData<'line'>),
        }),
      );
    } else if (toolName == 'point') {
      this.use(
        new PointTool({
          ...this._config.point,
          data: PointTool.convertToCanvasCoordinates(data as AnnotationToolData<'point'>),
        }),
      );
    } else if (toolName == 'rect') {
      this.use(
        new RectTool({
          ...this._config.rect,
          data: RectTool.convertToCanvasCoordinates(data as AnnotationToolData<'rect'>),
        }),
      );
    } else if (toolName == 'polygon') {
      this.use(
        new PolygonTool({
          ...this._config.polygon,
          data: PolygonTool.convertToCanvasCoordinates(data as AnnotationToolData<'polygon'>),
        }),
      );
    }

    this.render();
  }

  public destroy() {
    this._event!.removeAllListeners();
    this._tools.forEach((tool) => {
      tool.destroy();
    });
    this._tools.clear();
    this._axis?.destroy();
    this._axis = null;
    this.renderer = null;
  }

  public on = eventEmitter.on.bind(eventEmitter);
  public off = eventEmitter.off.bind(eventEmitter);
  public emit = eventEmitter.emit.bind(eventEmitter);
  public once = eventEmitter.once.bind(eventEmitter);
  public removeAllListeners = eventEmitter.removeAllListeners.bind(eventEmitter);
}
