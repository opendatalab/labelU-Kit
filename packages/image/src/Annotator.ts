import { Renderer } from './core/Renderer';
import type { CuboidToolOptions, PointToolOptions, RectToolOptions } from './tools';
import { CuboidTool, PointTool, RectTool } from './tools';
import type { LineToolOptions } from './tools/Line.tool';
import { LineTool } from './tools/Line.tool';
import type { CursorParams } from './shapes/Cursor.shape';
import type { ImageOption } from './core/BackgroundRenderer';
import { BackgroundRenderer } from './core/BackgroundRenderer';
import type { Axis } from './core/Axis';
import type { AnnotationData, AnnotationTool, AnnotationToolData, ToolName } from './interface';
import { EInternalEvent } from './enums';
import type { Monitor } from './core/Monitor';
import { axis, createAxis } from './singletons/axis';
import { createMonitor, eventEmitter, rbush } from './singletons';
import type { PolygonToolOptions } from './tools/Polygon.tool';
import { PolygonTool } from './tools/Polygon.tool';
import { Annotation, AnnotationMapping } from './annotations';

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

  cuboid?: CuboidToolOptions;

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
}

export class Annotator {
  public renderer: Renderer | null = null;

  public backgroundRenderer: BackgroundRenderer | null = null;

  public activeToolName: ToolName | null = null;

  public container: HTMLDivElement | null = null;

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

    this.container = container;

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
    this._initialTools();

    eventEmitter.on(EInternalEvent.ToolChange, this._handleToolChange);

    // @ts-ignore
    window.annotator = this;
  }

  private _initialContainer() {
    const { container, width, height, image } = this._config;

    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.position = 'relative';
    container.style.cursor = 'none';
    container.style.overflow = 'hidden';

    this.renderer = new Renderer({ container, width, height });
    this.renderer.canvas.style.position = 'absolute';
    this.renderer.canvas.style.width = `${width}px`;
    this.renderer.canvas.style.height = `${height}px`;
    this.renderer.canvas.style.left = '0';
    this.renderer.canvas.style.cursor = 'none';
    this.renderer.canvas.style.top = '0';
    this.renderer.canvas.style.zIndex = '2';

    this.backgroundRenderer = new BackgroundRenderer({ container, width, height, rotate: image?.rotate });
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

  private _initialTools() {
    const { _config } = this;

    if (_config.strokeWidth) {
      Annotation.strokeWidth = _config.strokeWidth;
    }
    if (_config.strokeOpacity) {
      Annotation.strokeOpacity = _config.strokeOpacity;
    }
    if (_config.fillOpacity) {
      Annotation.fillOpacity = _config.fillOpacity;
    }

    if (_config.line) {
      this.use(new LineTool({ ..._config.line, showOrder: _config.showOrder ?? true }));
    }

    if (_config.point) {
      this.use(new PointTool({ ..._config.point, showOrder: _config.showOrder ?? true }));
    }

    if (_config.rect) {
      this.use(new RectTool({ ..._config.rect, showOrder: _config.showOrder ?? true }));
    }

    if (_config.polygon) {
      this.use(new PolygonTool({ ..._config.polygon, showOrder: _config.showOrder ?? true }));
    }

    if (_config.cuboid) {
      this.use(new CuboidTool({ ..._config.cuboid, showOrder: _config.showOrder ?? true }));
    }
  }

  private _handleToolChange = (toolName: ToolName, label: string) => {
    this.switch(toolName, label);
  };

  public get monitor() {
    return this._monitor;
  }

  public rotate(angle: number) {
    const { backgroundRenderer } = this;

    const data = this.getFlatData();

    if (data.length > 0) {
      this.emit('error', '有标注数据时不可旋转');

      return;
    }

    if (!backgroundRenderer) {
      throw new Error('backgroundRenderer is not initialized');
    }

    backgroundRenderer.clear();
    backgroundRenderer.rotate(angle);
  }

  public resize(
    sizeOrWidth:
      | ((width: number, height: number) => { width: number; height: number })
      | { width: number; height: number }
      | number,
    height?: number,
  ) {
    const { backgroundRenderer, renderer, container } = this;

    if (!backgroundRenderer) {
      throw new Error('backgroundRenderer is not initialized');
    }

    if (!renderer) {
      throw new Error('renderer is not initialized');
    }

    if (!container) {
      throw new Error('container is not initialized');
    }

    let newSize;
    if (typeof sizeOrWidth === 'function') {
      newSize = sizeOrWidth(container.clientWidth, container.clientHeight);
    } else if (typeof sizeOrWidth === 'number' && typeof height === 'number') {
      newSize = { width: sizeOrWidth, height: height };
    } else if (typeof sizeOrWidth === 'object') {
      newSize = sizeOrWidth;
    } else {
      throw new Error('Invalid arguments');
    }

    container.style.width = `${newSize.width}px`;
    container.style.height = `${newSize.height}px`;
    renderer.resize(newSize.width, newSize.height);
    backgroundRenderer.resize(newSize.width, newSize.height);

    this.render();
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
  public switch(toolName: ToolName, label?: string) {
    if (typeof toolName !== 'string') {
      console.error('toolName must be string, such as "line" or "point"');

      return;
    }

    const { activeToolName } = this;
    const tool = this._tools.get(toolName);

    if (!tool) {
      // TODO：导向到文档
      console.warn(`Tool ${toolName} is not used!`);

      return;
    }

    if (activeToolName && activeToolName !== toolName) {
      this._tools.get(activeToolName)!.deactivate();
    }

    let pickedLabel = label;

    if (!label) {
      pickedLabel = tool.labelMapping.keys().next().value;
    }

    if (activeToolName !== toolName) {
      this.activeToolName = toolName;
      this.emit('toolChange', toolName, pickedLabel);
    }

    const AnnotationClass = AnnotationMapping[toolName];
    this._axis!.cursor!.style.stroke = AnnotationClass.labelStatic.getLabelColor(pickedLabel);
    tool.activate(pickedLabel);
    this.emit('labelChange', pickedLabel);
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

    const annotations: any[] = [];
    // 渲染工具
    _tools.forEach((tool) => {
      tool.render(renderer!.ctx!);

      if (tool.drawing) {
        annotations.push(...Array.from(tool.drawing.values() as any));
      }
    });

    // 按绘制顺序渲染
    annotations.sort((a, b) => a.data.order - b.data.order);

    annotations.forEach((annotation) => {
      annotation.render(renderer!.ctx!);
    });
  };

  public loadImage(url: string, options?: Omit<ImageOption, 'container' | 'width' | 'height' | 'url'>) {
    const { _config } = this;

    return this.backgroundRenderer!.loadImage(url, {
      ...options,
      width: _config.width,
      height: _config.height,
      container: _config.container,
      rotate: _config.image.rotate,
    });
  }

  public set showOrder(value: boolean) {
    this.config.showOrder = Boolean(value);

    for (const tool of this._tools.values()) {
      tool.toggleOrderVisible(value);
    }

    this._axis?.rerender();
  }

  public set strokeWidth(value: number) {
    Annotation.strokeWidth = value;

    const { _tools } = this;

    _tools.forEach((tool) => {
      tool.refresh();
    });

    this._axis?.rerender();
  }

  public set strokeOpacity(value: number) {
    Annotation.strokeOpacity = value;
    const { _tools } = this;

    _tools.forEach((tool) => {
      tool.refresh();
    });
    this._axis?.rerender();
  }

  public set fillOpacity(value: number) {
    Annotation.fillOpacity = value;
    const { _tools } = this;

    _tools.forEach((tool) => {
      tool.refresh();
    });
    this._axis?.rerender();
  }

  public getFlatData() {
    const result: any = [];

    Array.from(this._tools.values()).forEach((tool) => {
      result.push(...tool.data);
    });

    return result;
  }

  public getDataByTool() {
    const result: Record<string, any> = {};

    Array.from(this._tools.values()).forEach((tool) => {
      result[tool.name] = tool.data;
    });

    return result;
  }

  public export() {
    const { backgroundRenderer } = this;

    if (!backgroundRenderer) {
      throw new Error('backgroundRenderer is not initialized');
    }

    if (!backgroundRenderer.image) {
      throw new Error('backgroundRenderer.image is not initialized');
    }

    return {
      width: backgroundRenderer.image.width,
      height: backgroundRenderer.image.height,
      rotate: backgroundRenderer.rotateDegree,
      data: this.getDataByTool(),
    };
  }

  /**
   * 清除所有标注
   */
  public clearData() {
    this._tools.forEach((tool) => {
      tool.clear();
    });

    axis!.rerender();
  }

  public get showOrder() {
    return this.config.showOrder as boolean;
  }

  public setLabel(value: string) {
    if (typeof value !== 'string') {
      throw Error('value is not a string', value);
    }

    const { activeToolName, _tools } = this;

    if (!activeToolName) {
      return;
    }
    const currentTool = _tools.get(activeToolName);

    const AnnotationClass = AnnotationMapping[activeToolName];

    currentTool!.setLabel(value);
    this._axis!.cursor!.style.stroke = AnnotationClass.labelStatic.getLabelColor(value);
    this._axis?.rerender();
  }

  public get activeTool() {
    if (!this.activeToolName) {
      return;
    }

    return this._tools.get(this.activeToolName);
  }

  public setAttributes(attributes: Record<string, string | string[]>) {
    const { activeToolName, _tools } = this;

    if (!activeToolName) {
      return;
    }

    const currentTool = _tools.get(activeToolName);

    currentTool!.setAttributes(attributes);
  }

  /**
   * 指定标注id从外部删除标注
   *
   * @param toolName 工具名称
   * @param id 标注id
   */
  public removeAnnotationById(toolName: ToolName, id: string) {
    const { _tools } = this;

    const tool = _tools.get(toolName);

    if (!tool) {
      return;
    }

    tool.deleteAnnotation(id);
  }

  /**
   * 指定标注id从外部选中标注
   */
  public selectAnnotation(toolName: ToolName | undefined, id: string | undefined) {
    const selectTool = toolName || this.activeTool?.name;

    if (!selectTool) {
      console.warn('Tool is not initialized');

      return;
    }

    if (!this.monitor) {
      console.warn('Annotator is not initialized');

      return;
    }

    if (this.monitor.selectedAnnotationId === id) {
      return;
    }

    this.switch(selectTool);

    if (!id) {
      if (this.monitor?.selectedAnnotationId) {
        this.activeTool?.drawing
          ?.get(this.monitor.selectedAnnotationId)
          ?.group.emit(EInternalEvent.UnSelect, new MouseEvent(''));
      }

      return;
    }

    this.monitor.selectedAnnotationId = id;
    this.activeTool?.drawing?.get(id)?.group.emit(EInternalEvent.Select, new MouseEvent(''));
  }

  /**
   * 获取当前选中的标注
   */
  public getSelectedAnnotation(): AnnotationData | undefined {
    const { _tools, monitor, activeToolName } = this;
    const selectedAnnotationId = monitor?.selectedAnnotationId;

    if (!selectedAnnotationId || !activeToolName) {
      return;
    }

    const currentToolData = _tools.get(activeToolName)?.data;

    if (!currentToolData) {
      return;
    }

    return (currentToolData as AnnotationData[]).find((item) => item.id === selectedAnnotationId);
  }

  /**
   * 加载标注数据
   */
  public loadData<T extends ToolName>(toolName: T, data: AnnotationData[]) {
    if (!data) {
      return;
    }

    const { _config, _tools } = this;
    const tool = _tools.get(toolName);

    if (!_config) {
      return;
    }

    if (toolName == 'line') {
      const convertedData = LineTool.convertToCanvasCoordinates(data as unknown as AnnotationToolData<'line'>);

      if (tool) {
        // @ts-ignore
        tool.load(convertedData);
      } else {
        this.use(
          new LineTool({
            ...this._config.line,
            showOrder: _config.showOrder ?? false,
            data: convertedData,
          }),
        );
      }
    } else if (toolName == 'point') {
      const convertedData = PointTool.convertToCanvasCoordinates(data as unknown as AnnotationToolData<'point'>);

      if (tool) {
        // @ts-ignore
        tool.load(convertedData);
      } else {
        this.use(
          new PointTool({
            ...this._config.point,
            showOrder: _config.showOrder ?? false,
            data: convertedData,
          }),
        );
      }
    } else if (toolName == 'rect') {
      const convertedData = RectTool.convertToCanvasCoordinates(data as unknown as AnnotationToolData<'rect'>);

      if (tool) {
        // @ts-ignore
        tool.load(convertedData);
      } else {
        this.use(
          new RectTool({
            ...this._config.rect,
            showOrder: _config.showOrder ?? false,
            data: convertedData,
          }),
        );
      }
    } else if (toolName == 'polygon') {
      const convertedData = PolygonTool.convertToCanvasCoordinates(data as unknown as AnnotationToolData<'polygon'>);

      if (tool) {
        // @ts-ignore
        tool.load(convertedData);
      } else {
        this.use(
          new PolygonTool({
            ...this._config.rect,
            showOrder: _config.showOrder ?? false,
            data: convertedData,
          }),
        );
      }
    } else if (toolName == 'cuboid') {
      const convertedData = CuboidTool.convertToCanvasCoordinates(data as unknown as AnnotationToolData<'cuboid'>);

      if (tool) {
        // @ts-ignore
        tool.load(convertedData);
      } else {
        this.use(
          new CuboidTool({
            ...this._config.cuboid,
            showOrder: _config.showOrder ?? false,
            data: convertedData,
          }),
        );
      }
    } else {
      console.warn(`Tool ${toolName} is not supported`);
    }

    this.render();
    this.emit('load', toolName, data);
  }

  public destroy() {
    this._tools.forEach((tool) => {
      tool.clear();
      tool.destroy();
    });
    this._event!.removeAllListeners();
    this._tools.clear();
    this._axis?.destroy();
    this._monitor?.destroy();
    this._monitor = null;
    this._axis = null;
    this.renderer?.destroy();
    this.renderer = null;
    this.backgroundRenderer?.destroy();
    this.backgroundRenderer = null;
    this._config = null as any;
    rbush.clear();
  }

  public on = eventEmitter.on.bind(eventEmitter);
  public off = eventEmitter.off.bind(eventEmitter);
  public emit = eventEmitter.emit.bind(eventEmitter);
  public once = eventEmitter.once.bind(eventEmitter);
  public removeAllListeners = eventEmitter.removeAllListeners.bind(eventEmitter);
}
