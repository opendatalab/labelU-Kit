import { isNumber } from 'lodash-es';
// TODO: 将eventBus替换成eventEmitter3
// import EventEmitter from 'eventemitter3';

import { styleDefaultConfig } from '@/constant/defaultConfig';
import { DEFAULT_FONT, EToolName } from '@/constant/tool';
import type { Attribute, PrevResult, ToolConfig } from '@/interface/combineTool';
import type { IImageAttribute } from '@/types/imgAttributeStore';
import type { IRenderEnhance, TDataInjectionAtCreateion } from '@/types/tool/annotation';
import type { ICoordinate, ISize } from '@/types/tool/common';
import type { ILinePoint } from '@/types/tool/lineTool';
import type { IPolygonConfig, IPolygonData } from '@/types/tool/polygon';
import type { IRectConfig } from '@/types/tool/rectTool';
import MathUtils from '@/utils/MathUtils';
import AxisUtils, { CoordinateUtils } from '@/utils/tool/AxisUtils';
import CanvasUtils from '@/utils/tool/CanvasUtils';
import CommonToolUtils from '@/utils/tool/CommonToolUtils';
import LineToolUtils, { LINE_ORDER_OFFSET } from '@/utils/tool/LineToolUtils';
import TagUtils from '@/utils/tool/TagUtils';

import { DEFAULT_TEXT_OFFSET, EDragStatus, EGrowthMode, ELang, TEXT_ATTRIBUTE_OFFSET } from '../../constant/annotation';
import EKeyCode from '../../constant/keyCode';
import { BASE_ICON, COLORS_ARRAY } from '../../constant/style';
import locale from '../../locales';
import { EMessage } from '../../locales/constants';
import ActionsHistory from '../../utils/ActionsHistory';
import AttributeUtils from '../../utils/tool/AttributeUtils';
import DblClickEventListener from '../../utils/tool/DblClickEventListener';
import DrawUtils from '../../utils/tool/DrawUtils';
import ImgPosUtils from '../../utils/tool/ImgPosUtils';
import RenderDomUtils from '../../utils/tool/RenderDomUtils';
import ZoomUtils from '../../utils/tool/ZoomUtils';
import EventListener from './eventListener';

export interface IBasicToolOperationProps {
  container: HTMLElement;
  size: ISize;
  imgNode?: HTMLImageElement; // 展示图片的内容
  style?: any; // 后期一定要补上!!

  rotate?: number;
  imgAttribute?: any; // 占个坑，用于全局的一些配置，是否展示原图比例
  forbidOperation?: boolean;

  config: ToolConfig; // 任务配置

  defaultAttribute?: string;
  forbidCursorLine?: boolean;
  showDefaultCursor?: boolean; // 默认会展示为 none

  forbidBasicResultRender?: boolean;
  isShowOrder: boolean;
}

/**
 * 参考显示数据
 */
interface IReferenceData {
  toolName: EToolName.Polygon | EToolName.Line | EToolName.LineMarker;
  result: IPolygonData[] | ILinePoint[];
  config: any;
}

// zoom 的限制
const zoomInfo = {
  min: 0.2,
  max: 1000,
  ratio: 0.4,
};

const validNumber = (value: number) => {
  return isNumber(value) && !isNaN(value);
};

export default class BasicToolOperation extends EventListener {
  static NONE_ATTRIBUTE = 'noneAttribute';

  public container: HTMLElement; // 当前结构绑定 container

  public canvas!: HTMLCanvasElement;

  public basicCanvas!: HTMLCanvasElement;

  public imgNode?: HTMLImageElement;

  public basicImgInfo: any; // 用于存储当前图片的信息

  public isImgError: boolean; // 图片是否错误

  // 数据依赖
  public basicResult?: any; // 可能存在含有 dependToolName 但是不含有 basicResult 的情况

  public referenceData?: IReferenceData;

  public dependToolName?: EToolName;

  // 工具记录
  public history: ActionsHistory; // 存储当前任务下的所有记录

  public size: ISize;

  public isShowCursor: boolean; // 是否展示十字光标

  public forbidOperation: boolean; // 禁止操作

  public forbidBasicResultRender: boolean; // 禁止渲染基础依赖图形

  public isShowOrder: boolean; //是否显示标注顺序

  public isShowAttributeText: boolean; //是否显示标签文本

  // public style: {
  //   strokeColor: string;
  //   fillColor: string;
  //   strokeWidth: number;
  //   opacity: number;
  // };
  public style: any;

  public zoom: number;

  // 用于拖拽缩放操作
  public currentPos: ICoordinate; // 存储实时偏移的位置

  public coord: ICoordinate; // 存储当前鼠标的坐标

  public imgInfo?: ISize;

  public isDrag = false; // 判断是否进行拖拽

  public isSpaceKey = false; // 是否点击空格键

  public attributeLockList: string[]; // 属性限制列表

  public allAttributes!: Attribute[]; // 多工具所有标签集合

  public allAttributesMap!: Map<Attribute['value'], Attribute['key']>; // 多工具所有标签Map集合

  public dblClickListener: DblClickEventListener;

  public isHidden: boolean;

  public config: any; // 供后面操作使用

  public dragStatus: EDragStatus; // 用于拖拽中间状态的判断

  public defaultAttribute: string; // 默认属性

  public forbidCursorLine: boolean;

  public lang: ELang;

  public dataInjectionAtCreation?: TDataInjectionAtCreateion;

  public renderEnhance?: IRenderEnhance;

  // 拖拽 - 私有变量
  private _firstClickCoordinate?: ICoordinate; // 存储第一次点击的坐标

  private innerZoom = 1; // 用于内外 zoom 事件的变量

  private currentPosStorage?: ICoordinate; // 存储当前点击的平移位置

  private basicZoom = 0.01; // 限定最少放大倍数

  private isSpaceClick = false; // 用于空格拖拽

  private isDragStart = false; // 用于拖拽情况的初始判定

  private startTime = 0; // 开始时间

  private _ctx?: CanvasRenderingContext2D;

  private _imgAttribute?: IImageAttribute;

  private _invalidDOM?: HTMLElement;

  // 缓存图片的坐标和缩放比例
  static Cache: Map<string, ICoordinate | number> = new Map();

  private _coordinateCacheKey: string = '';

  private _zoomCacheKey: string = '';

  private showDefaultCursor: boolean; // 是否展示默认的 cursor

  public coordUtils: CoordinateUtils;

  public prevResultList?: PrevResult[];

  public renderReady: boolean | undefined;

  public saveDataEvent: Event;

  constructor(props: IBasicToolOperationProps) {
    super();

    this.saveDataEvent = new CustomEvent('saveLabelResultToImg', {});
    this.renderReady = false;
    this.container = props.container;
    this.showDefaultCursor = props.showDefaultCursor || false;
    if (!this.basicCanvas) {
      this.initCanvas(props.size);
    }
    // this.destroyCanvas();
    // this.createCanvas(props.size);
    this.imgNode = props.imgNode;
    // 设置图片位置和zoom缓存key
    if (props.imgNode && props.imgNode.src) {
      this._coordinateCacheKey = `coordinate::${props.imgNode.src}`;
      this._zoomCacheKey = `zoom::${props.imgNode.src}`;
    }
    this.isImgError = !props.imgNode;
    this.basicImgInfo = {
      width: props.imgNode?.width ?? 0,
      height: props.imgNode?.height ?? 0,
      valid: true,
      rotate: 0,
    };
    this.forbidOperation = props.forbidOperation ?? false;
    this.forbidBasicResultRender = props.forbidBasicResultRender ?? false;

    this.size = props.size;
    this.currentPos = {
      x: 0,
      y: 0,
    };
    this.zoom = 1;
    this.coord = {
      x: -1,
      y: -1,
    };
    this.currentPosStorage = {
      x: 0,
      y: 0,
    };
    this.isShowCursor = false;
    this.isShowOrder = false;
    this.isShowAttributeText = true;
    this.style = {
      strokeColor: COLORS_ARRAY[4],
      fillColor: COLORS_ARRAY[4],
      strokeWidth: 2 * window?.devicePixelRatio,
      opacity: 1,
    };
    this.attributeLockList = [];
    this.history = new ActionsHistory();
    this.style = props.style ?? {};
    this._imgAttribute = props.imgAttribute ?? {};
    this.isHidden = false;
    this.dragStatus = EDragStatus.Wait;
    this.defaultAttribute = props?.defaultAttribute ?? BasicToolOperation.NONE_ATTRIBUTE;
    this.forbidCursorLine = !!props.forbidCursorLine;
    this.lang = ELang.Zh;

    // 阻止右键菜单栏
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onLeftDblClick = this.onLeftDblClick.bind(this);
    this.onRightDblClick = this.onRightDblClick.bind(this);
    this.onClick = this.onClick.bind(this);
    this.clearImgDrag = this.clearImgDrag.bind(this);
    // 初始化监听事件
    this.dblClickListener = new DblClickEventListener(this.container, 200);
    this.coordUtils = new CoordinateUtils(this);
    this.coordUtils.setBasicImgInfo(this.basicImgInfo);
  }

  public onContextmenu(e: MouseEvent) {
    e.preventDefault();
  }

  get ctx() {
    return this._ctx || this.canvas?.getContext('2d');
  }

  get NoneAttribute() {
    return BasicToolOperation.NONE_ATTRIBUTE;
  }

  get basicCtx() {
    return this.basicCanvas?.getContext('2d');
  }

  get rotate() {
    return this.basicImgInfo?.rotate ?? 0;
  }

  get valid() {
    return this.basicImgInfo?.valid ?? true;
  }

  get baseIcon() {
    // this.style.color 获取当前的颜色的位置的  1 3 5 7 9
    return BASE_ICON[this.style.color];
  }

  get defaultCursor() {
    return this.showDefaultCursor ? 'default' : 'none';
  }

  /** 数据列表，根据其判断是否可以旋转 */
  get dataList(): any[] {
    return [];
  }

  hasAttributeInConfig(attribute: string) {
    if (attribute === '') {
      return false;
    }

    if (attribute === this.NoneAttribute) {
      return true;
    }

    return this.config.attributeMap.has(attribute);
  }

  /**
   * 设置此前工具标注结果信息
   */
  public setPrevResultList(prevResultList: PrevResult[]) {
    this.prevResultList = prevResultList;
  }

  /**
   * 多工具全量标签设置
   */
  public setAllAttributes(allAttributes: Attribute[]) {
    this.allAttributes = allAttributes;
    this.allAttributesMap = new Map();

    this.allAttributesMap.set(this.NoneAttribute, locale.getMessagesByLocale(EMessage.NoneAttribute, this.lang));

    this.allAttributes.forEach((attribute) => {
      this.allAttributesMap.set(attribute.value, attribute.key);
    });
  }

  /**
   * 是否含有列表标注
   */
  public get hasMarkerConfig() {
    return this.config.markerConfigurable === true && this.config.markerList && this.config.markerList.length > 0;
  }

  public setZoom(zoom: number) {
    this.zoom = zoom;
    this.coordUtils.setZoomAndCurrentPos(this.zoom, this.currentPos);
  }

  public setCurrentPos(currentPos: ICoordinate) {
    this.currentPos = currentPos;
    this.coordUtils.setZoomAndCurrentPos(this.zoom, this.currentPos);
  }

  public setReferenceData(referenceData: IReferenceData) {
    this.referenceData = referenceData;
  }

  /**
   * 外界直接更改当前渲染位置
   * @param zoom
   * @param currentPos
   */
  public updatePosition(params: { zoom: number; currentPos: ICoordinate }) {
    const { zoom, currentPos } = params;
    // 内部位置初始化
    this.setZoom(zoom);
    this.setCurrentPos(currentPos);
    this.currentPosStorage = currentPos;
    this.innerZoom = zoom;

    this.renderBasicCanvas();
    this.render();
  }

  public setLang(lang: ELang) {
    this.lang = lang;
  }

  public setShowDefaultCursor(showDefaultCursor: boolean) {
    this.showDefaultCursor = showDefaultCursor;
    this.container.style.cursor = this.defaultCursor;
  }

  // 是否限制鼠标操作
  public get forbidMouseOperation() {
    return this.forbidOperation || this.valid === false;
  }

  public get pixelRatio() {
    return CanvasUtils.getPixelRatio(this.canvas?.getContext('2d'));
  }

  public async init() {
    this.eventUnbinding();
    await this.initPosition();
    this.eventBinding();
    // 多余渲染，影响性能
    // this.render();
    // this.renderBasicCanvas();
  }

  public destroy() {
    this.destroyCanvas();
    this.eventUnbinding();
    this.clearCache();
  }

  public clearCache() {
    BasicToolOperation.Cache.clear();
  }

  public clearCachedCoordinateAndZoom() {
    BasicToolOperation.Cache.delete(this._coordinateCacheKey);
    BasicToolOperation.Cache.delete(this._zoomCacheKey);
  }

  public initCanvas(size: ISize) {
    const pixel = this.pixelRatio;
    const childCanvas = this.container.querySelectorAll('canvas');
    if (childCanvas && childCanvas.length > 0) {
      this.canvas = childCanvas[1] as HTMLCanvasElement;
      this.basicCanvas = childCanvas[0] as HTMLCanvasElement;
      // 删除非canvas 的dom
      this.clearExtraDom(this.container);
    } else {
      const basicCanvas = document.createElement('canvas');
      basicCanvas.width = size.width * pixel;
      basicCanvas.height = size.height * pixel;
      basicCanvas.style.width = `${size.width}px`;
      basicCanvas.style.height = `${size.height}px`;
      basicCanvas.style.left = '0';
      basicCanvas.style.top = '0';
      basicCanvas.style.zIndex = '0';
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.zIndex = '10';
      canvas.style.width = `${size.width}px`;
      canvas.style.height = `${size.height}px`;
      canvas.width = size.width * pixel;
      canvas.height = size.height * pixel;
      this.canvas = canvas;
      this.basicCanvas = basicCanvas;
      this.container.appendChild(basicCanvas);
      this.container.appendChild(canvas);
    }
    this.container.style.cursor = this.defaultCursor;
    this.ctx?.scale(pixel, pixel);
    this.basicCtx?.scale(pixel, pixel);
  }

  public clearExtraDom(container: HTMLElement) {
    const { childNodes } = container;
    if (childNodes && childNodes.length > 0) {
      for (let i = 0; i < childNodes.length; i++) {
        if (childNodes[i].nodeName !== 'CANVAS') {
          container.removeChild(childNodes[i]);
        }
      }
    }
  }

  public destroyCanvas() {
    if (this.canvas && this.container.contains(this.canvas)) {
      // container 内可能包含其他元素，故需单独清楚
      this.container.removeChild(this.canvas);
    }

    if (this.basicCanvas && this.container.contains(this.basicCanvas)) {
      this.container.removeChild(this.basicCanvas);
    }

    // 恢复初始状态
    this.clearInvalidPage();
    this.clearImgDrag();
  }

  /**
   * 设置框的样式
   * @param lineWidth
   * @param strokeColorinitImgPos
   */
  public setStyle(toolStyle: any) {
    this.style = toolStyle;
    this.render();
  }

  public setImgNode(imgNode: HTMLImageElement, basicImgInfo: Partial<{ valid: boolean; rotate: number }> = {}) {
    this.imgNode = imgNode;

    // 图片更新后，更新缓存key
    if (imgNode) {
      this._coordinateCacheKey = `coordinate::${imgNode.src}`;
      this._zoomCacheKey = `zoom::${imgNode.src}`;
    }

    this.setBasicImgInfo({
      width: imgNode.width,
      height: imgNode.height,
      valid: true,
      rotate: 0,
      ...basicImgInfo,
    });

    if (this.isImgError === true) {
      this.isImgError = false;
      this.emit('changeAnnotationShow');
    }

    if (typeof basicImgInfo.valid === 'boolean') {
      this.setValid(basicImgInfo.valid);
    }
    this.initImgPos({ useCachedPosition: false });
    // 多余渲染，影响性能
    // this.render();
    // this.renderBasicCanvas();
  }

  public setErrorImg() {
    const originIsImgError = this.isImgError;
    // 设置当前为错误图片
    this.isImgError = true;
    this.imgNode = undefined;

    this._coordinateCacheKey = '';
    this._zoomCacheKey = '';

    this.setBasicImgInfo({
      width: 0,
      height: 0,
      valid: true,
      rotate: 0,
    });

    if (originIsImgError === false) {
      this.emit('changeAnnotationShow');
    }
  }

  public setBasicImgInfo(basicImgInfo: any) {
    this.basicImgInfo = basicImgInfo;
    this.coordUtils.setBasicImgInfo(basicImgInfo);
  }

  public setForbidOperation(forbidOperation: boolean) {
    this.forbidOperation = forbidOperation;
    this.render();
  }

  public setForbidCursorLine(forbidCursorLine: boolean) {
    this.forbidCursorLine = forbidCursorLine;
    this.render();
  }

  public setIsHidden(isHidden: boolean) {
    this.isHidden = isHidden;

    this.emit('hiddenChange');
  }

  /**
   * 用于外界直接控制序号的是否展示
   * @param isShowOrder
   */
  public setIsShowOrder(isShowOrder: boolean) {
    this.isShowOrder = isShowOrder;
    this.render();
  }

  /**
   * 用于外界控制标签文本是否显示
   */
  public setisShowAttributeText(isShowAttributeText: boolean) {
    this.isShowAttributeText = isShowAttributeText;
    this.renderBasicCanvas();
  }

  /** 获取坐标值 */
  public getCoordinate(e: MouseEvent) {
    const bounding = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - bounding.left,
      y: e.clientY - bounding.top,
    };
  }

  /** 获取当前zoom 下的坐标 */
  public getCoordinateUnderZoom(e: MouseEvent) {
    const bounding = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - bounding.left - this.currentPos.x,
      y: e.clientY - bounding.top - this.currentPos.y,
    };
  }

  public setDefaultAttribute(attribute: string) {
    this.defaultAttribute = attribute;
  }

  /**
   * Get the coordinate point in the original image coordinate system by mouse events
   * @param e
   * @returns
   */
  public getCoordinateInOrigin(e: MouseEvent) {
    const bounding = this.canvas.getBoundingClientRect();

    return {
      x: (e.clientX - bounding.left - this.currentPos.x) / this.zoom,
      y: (e.clientY - bounding.top - this.currentPos.y) / this.zoom,
    };
  }

  public getGetCenterCoordinate() {
    return {
      x: this.size.width / 2,
      y: this.size.height / 2,
    };
  }

  /** 用于初始化图片的位置 */
  public initImgPos = async (options?: { useCachedPosition?: boolean }) => {
    if (!this.imgNode || this.imgNode.width === 0) {
      return;
    }
    // 初始化图片位置信息时，优先从持久化记录中获取
    const { useCachedPosition } = options || { useCachedPosition: true };
    const zoomRatio = this._imgAttribute?.zoomRatio;
    const isOriginalSize = this._imgAttribute?.isOriginalSize;
    const { currentPos, zoom } = ImgPosUtils.getInitImgPos(
      this.size,
      { width: this.imgNode.width, height: this.imgNode.height },
      this.rotate,
      zoomRatio,
      isOriginalSize,
    );
    // 初始化图片位置信息时，优先从持久化记录中获取
    const cachedCoordinate = BasicToolOperation.Cache.get(this._coordinateCacheKey) as ICoordinate;
    this.setCurrentPos(useCachedPosition ? cachedCoordinate || currentPos : currentPos);
    this.currentPosStorage = useCachedPosition ? cachedCoordinate : currentPos;
    let cachedZoom = 0;
    // 当部位原图比例显示时，采用stable zoom
    if (!isOriginalSize) {
      // 初始化图片缩放信息，优先从持久化记录中获取
      cachedZoom = BasicToolOperation.Cache.get(this._zoomCacheKey) as number;
    } else {
      BasicToolOperation.Cache.set(this._zoomCacheKey, 1);
    }

    const finalZoom = cachedZoom || zoom;
    /**
     * 修正https://project.feishu.cn/bigdata_03/issue/detail/3756207?parentUrl=%2Fbigdata_03%2FissueView%2FXARIG5p4g
     * 因zoom可被缓存，在切换工具或切换图片列表时需要由缓存后的zoom重新计算imgInfo
     **/
    this.imgInfo = {
      width: this.imgNode.width * finalZoom,
      height: this.imgNode.height * finalZoom,
    };
    this.setZoom(finalZoom);

    this.innerZoom = finalZoom;
    this.renderReady = true;
    this.render();
    this.renderBasicCanvas();

    this.emit('dependRender');
    this.emit('renderZoom', finalZoom);
  };

  /**
   * 用于依赖情况下的图片初始化
   */
  public async initPosition() {
    if (this.basicResult && this.imgInfo) {
      // 目的： 初始化有依赖情况下的多框展示
      const { basicResult, size, imgNode, _imgAttribute, imgInfo, dependToolName } = this;
      if (basicResult && imgNode && dependToolName) {
        let newBoundry = basicResult;

        switch (dependToolName) {
          case EToolName.Polygon:
          case EToolName.Line: {
            // 依赖检测
            if (basicResult.pointList) {
              // 多边形检测
              const basicZone = MathUtils.calcViewportBoundaries(basicResult.pointList);
              newBoundry = {
                x: basicZone.left,
                y: basicZone.top,
                width: basicZone.right - basicZone.left,
                height: basicZone.bottom - basicZone.top,
              };
            }
            break;
          }

          default: {
            //
          }
        }

        const pos = ImgPosUtils.getBasicRecPos(
          imgNode,
          newBoundry,
          size,
          undefined,
          _imgAttribute?.zoomRatio,
          _imgAttribute?.isOriginalSize,
        );
        if (pos) {
          this.setCurrentPos(pos.currentPos);
          this.currentPosStorage = this.currentPos;
          this.imgInfo = {
            ...imgInfo,
            width: (imgInfo.width / this.innerZoom) * pos.innerZoom,
            height: (imgInfo.height / this.innerZoom) * pos.innerZoom,
          };
          this.innerZoom = pos.innerZoom;
          // 需要加载下更改当前的 imgInfo
          this.setZoom(pos.innerZoom);
          this.render();
          this.renderBasicCanvas();
        }
      }
    } else {
      await this.initImgPos();
    }
  }

  public getCurrentPos = (coord: any) => {
    const { _firstClickCoordinate, currentPosStorage } = this;
    try {
      let currentPos;
      if (_firstClickCoordinate && currentPosStorage) {
        currentPos = {
          y: currentPosStorage.y + coord.y - _firstClickCoordinate.y,
          x: currentPosStorage.x + coord.x - _firstClickCoordinate.x,
        };
      } else {
        currentPos = {
          x: 0,
          y: 0,
        };
      }
      return currentPos;
    } catch (e) {
      console.error(e);
      return {
        x: 0,
        y: 0,
      };
    }
  };

  /** 撤销 */
  public undo() {
    this.history.undo();
  }

  /** 重做 */
  public redo() {
    this.history.redo();
  }

  public clearCanvas() {
    this.ctx?.clearRect(0, 0, this.size.width, this.size.height);
  }

  public clearBasicCanvas() {
    this.basicCtx?.clearRect(0, 0, this.size.width, this.size.height);
  }

  /** 事件绑定 */
  public eventBinding() {
    this.dblClickListener.addEvent(() => {}, this.onLeftDblClick, this.onRightDblClick);
    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('mouseleave', this.onMouseLeave);
    this.container.addEventListener('click', this.onClick);
    this.container.addEventListener('wheel', this.onWheel);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    if (typeof window !== 'undefined') {
      window.parent.document.addEventListener('contextmenu', this.onContextmenu, false);
    }
  }

  public eventUnbinding() {
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('mouseleave', this.onMouseLeave);
    this.container.removeEventListener('wheel', this.onWheel);
    this.container.removeEventListener('click', this.onClick);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    if (typeof window !== 'undefined') {
      window.parent.document.removeEventListener('contextmenu', this.onContextmenu, false);
    }
    this.dblClickListener.removeEvent();
  }

  public clearImgDrag() {
    this.isDrag = false;
    this.isDragStart = false;
    this.isSpaceClick = false;
    this.startTime = 0;
    this.container.style.cursor = this.defaultCursor;
    this.forbidCursorLine = false;
  }

  public onMouseDown(e: MouseEvent): void | boolean {
    // e.stopPropagation();
    if (!this.canvas || this.isImgError) {
      return true;
    }

    // if (window.getSelection) {
    //   // 获取选中
    //   const selection = window.getSelection();
    //   // 清除选中
    //   selection.removeAllRanges();
    // } else if (document.selection && document.selection.empty) {
    //   // 兼容 IE8 以下，但 IE9+ 以上同样可用
    //   document.selection.empty();
    // }

    const coord = this.getCoordinate(e);

    if ((this.isSpaceKey && e.button === 0) || e.button === 2) {
      e.stopPropagation();
      this._firstClickCoordinate = coord;
      this.currentPosStorage = this.currentPos;
      this.isSpaceClick = true;
      this.isDragStart = true;
      this.startTime = new Date().getTime();
    }
  }

  public onMouseMove(e: MouseEvent): boolean | void {
    if (!this.canvas || this.isImgError) {
      return true;
    }
    const coord = this.getCoordinate(e);

    // 是否展示十字光标
    if (this.isShowCursor) {
      this.coord = coord;
    }

    try {
      if (!coord || !isNumber(coord?.x) || !isNumber(coord?.y)) {
        throw new Error('coord error');
      }

      this.coord = coord;
      if ((this.isSpaceClick || this.isDragStart) && this._firstClickCoordinate) {
        const currentPos = this.getCurrentPos(coord);
        this.setCurrentPos(currentPos);
        this.isDrag = true;
        this.container.style.cursor = 'grabbing';
        this.forbidCursorLine = true;
        this.renderBasicCanvas();

        // 依赖渲染触发
        this.emit('dependRender');

        // 拖拽信息触发
        this.emit('dragMove', { currentPos, zoom: this.zoom });
      }

      this.render();
    } catch (error) {
      console.error(error);
    }
  }

  public onMouseUp(e: MouseEvent): boolean | void {
    if (!this.canvas || this.isImgError) {
      return true;
    }
    this.container.style.cursor = this.defaultCursor;
    this.forbidCursorLine = false;

    this.isDrag = false;
    this.isDragStart = false;
    this.isSpaceClick = false;

    if (this.startTime !== 0 && this._firstClickCoordinate) {
      const time = new Date().getTime();
      const currentCoord = this.getCoordinate(e);
      // 拖拽时，更新持久化图片位置信息
      const newCoordinate = this.getCurrentPos(currentCoord);

      if (this._isValidCoordinate(newCoordinate)) {
        BasicToolOperation.Cache.set(this._coordinateCacheKey, newCoordinate);
      }
      /**
       * 图片拖拽判断
       * 1. 拖拽时间超过 1 秒则为拖拽
       * 2. 开启了 space 键为拖拽
       * 3. 鼠标移动 10 像素
       */
      if (
        time - this.startTime > 1000 ||
        this.isSpaceKey === true ||
        LineToolUtils.calcTwoPointDistance(currentCoord, this._firstClickCoordinate) > 10
      ) {
        e.stopPropagation();
        this.startTime = 0;
        this.render();
        return true;
      }
    }

    this.startTime = 0;
    this.render();
  }

  // 后续需抽象成 abstract
  public onMouseLeave() {
    //  鼠标脱离了屏幕
    // 清除拖拽状态
    this.clearImgDrag();
  }

  // eslint-disable-next-line no-unused-vars
  public onClick(_e: MouseEvent) {}

  // eslint-disable-next-line no-unused-vars
  public onLeftDblClick(_e: MouseEvent) {
    // 左键双击
  }

  // eslint-disable-next-line no-unused-vars
  public onRightDblClick(_e: MouseEvent) {
    // 右键双击
    this.clearImgDrag();
  }

  public onKeyDown(e: KeyboardEvent): boolean | void {
    /** 取消window系统下默认的失焦事件 */
    if (e.keyCode === EKeyCode.Alt) {
      e.preventDefault();
    }

    // empty
    switch (e.keyCode) {
      case EKeyCode.Space:
        this.isSpaceKey = true;
        break;

      // case EKeyCode.Z:
      //   if (e.ctrlKey) {
      //     debugger;
      //     if (e.shiftKey) {
      //       this.redo();
      //     } else {
      //       this.undo();
      //     }

      //     return false;
      //   }
      //   break;

      default: {
        break;
      }
      // case EKeyCode.F11:
      //   if (!document.fullscreenElement) {
      //     document.documentElement.requestFullscreen();
      //   } else {
      //     if (document.exitFullscreen) {
      //       document.exitFullscreen();
      //     }
      //   }
      //   e.preventDefault();

      //   break;
    }
    return true;
  }

  public onKeyUp(e: KeyboardEvent): boolean | void {
    // empty
    switch (e.keyCode) {
      case EKeyCode.Space:
        this.isSpaceKey = false;
        break;

      default: {
        break;
      }
    }
  }

  // 按鼠标位置放大缩小
  public onWheel(e: any, isRender = true): boolean | void {
    if (!this.imgNode || !this.coord) {
      return;
    }

    // 禁止外层滚轮操作
    e.preventDefault();
    e.stopPropagation();

    const coord = this.getCoordinate(e);

    const delta = e.deltaY || e.wheelDelta;

    let operator: 0 | -1 | 1 = 0;

    if (delta > 0 && this.zoom > zoomInfo.min) {
      // 减小
      operator = -1;
    }
    if (delta < 0 && this.zoom < zoomInfo.max) {
      // 放大
      operator = 1;
    }

    this.wheelChangePos(coord, operator);
    this.emit('dependRender');
    if (isRender) {
      this.render();
    }
    this.renderBasicCanvas();
  }

  public wheelChangePos = (coord: ICoordinate, operator: 1 | -1 | 0, newZoom?: number) => {
    // 更改放大后图片的位置以及倍数, operator: 1 放大， -1 缩小， 0 放大
    const { currentPos, imgNode } = this;
    if (!imgNode) {
      console.error('unable to load image');
      return;
    }
    if (this.zoom === this.basicZoom && operator === -1) {
      return;
    }

    const pos = ZoomUtils.wheelChangePos(imgNode, coord, operator, currentPos, {
      zoom: newZoom || this.zoom,
      innerZoom: this.innerZoom,
      basicZoom: this.basicZoom,
      zoomMax: zoomInfo.max,
      rotate: this.rotate,
    });

    if (!pos) {
      return;
    }

    const { currentPos: newCurrentPos, ratio, zoom, imgInfo } = pos;

    // 缩放时，更新持久化图片位置信息
    if (this._isValidCoordinate(newCurrentPos)) {
      BasicToolOperation.Cache.set(this._coordinateCacheKey, newCurrentPos);
    }
    // 缩放时，更新持久化图片缩放信息
    if (validNumber(zoom)) {
      BasicToolOperation.Cache.set(this._zoomCacheKey, zoom);
    }

    this.innerZoom = zoom;
    this.setZoom(zoom);
    this.setCurrentPos(newCurrentPos);
    this.currentPosStorage = newCurrentPos;
    this.imgInfo = imgInfo;
    zoomInfo.ratio = ratio;
    this.emit('renderZoom', zoom, currentPos);
  };

  /**
   * 通过ZOOM_LEVEL, 计算出下一个缩放的值。
   * @param isZoomIn 是否为放大
   */
  public zoomChanged = (isZoomIn: boolean, growthMode = EGrowthMode.Linear) => {
    const newZoom = ZoomUtils.zoomChanged(this.zoom, isZoomIn, growthMode);
    this.wheelChangePos(this.getGetCenterCoordinate(), newZoom > this.zoom ? 1 : -1, newZoom);
    this.render();
    this.renderBasicCanvas();
  };

  public renderCursorLine(lineColor = this.style.lineColor[0] ?? '') {
    if (!this.ctx || this.forbidCursorLine) {
      return;
    }

    const { x, y } = this.coord;
    DrawUtils.drawLine(this.canvas, { x: 0, y }, { x: 10000, y }, { color: lineColor });
    DrawUtils.drawLine(this.canvas, { x, y: 0 }, { x, y: 10000 }, { color: lineColor });
    DrawUtils.drawCircleWithFill(this.canvas, { x, y }, 1, { color: 'white' });
  }

  public drawImg = () => {
    if (!this.imgNode) return;

    DrawUtils.drawImg(this.basicCanvas, this.imgNode, {
      zoom: this.zoom,
      currentPos: this.currentPos,
      rotate: this.rotate,
      imgAttribute: this._imgAttribute,
    });
  };

  /**
   * 更改当前 canvas 整体的大小，需要重新初始化
   * @param size
   */
  public setSize(size: ISize) {
    this.size = size;
    if (this.container.contains(this.canvas)) {
      this.destroyCanvas();
      this.initCanvas(size);
      this.eventUnbinding();
      this.init();

      if (this.basicImgInfo?.valid === false) {
        this.renderInvalidPage();
      }
    }
  }

  public setImgAttribute(imgAttribute: IImageAttribute) {
    const oldImgAttribute = this._imgAttribute;
    this._imgAttribute = imgAttribute;
    if (oldImgAttribute?.zoomRatio !== imgAttribute.zoomRatio || imgAttribute.isOriginalSize) {
      this.initImgPos({ useCachedPosition: false });
      return;
    }
    this.renderBasicCanvas();
    this.render();
  }

  public clearResult(sendMessage?: boolean | string) {
    // 清除数据
    if (sendMessage) {
      // send someting
    }
  }

  private _isValidCoordinate(coordinate: ICoordinate) {
    if (!coordinate) {
      return false;
    }

    return validNumber(coordinate.x) && validNumber(coordinate.y);
  }

  public setValid(valid: boolean) {
    this.basicImgInfo.valid = valid;
    if (valid === false) {
      this.renderInvalidPage();
      this.clearResult(false);
    } else {
      this.clearInvalidPage();
    }
  }

  public setRotate(rotate: number) {
    this.basicImgInfo.rotate = rotate;
  }

  // 考虑删除 todo
  public setBasicResult(basicResult: any) {
    this.basicResult = basicResult;
    this.coordUtils.setBasicResult(basicResult);
    this.initPosition();
    this.emit('dependRender');
  }

  public setDependName(dependToolName: EToolName, dependToolConfig?: IRectConfig | IPolygonConfig) {
    this.dependToolName = dependToolName;
    this.coordUtils.setDependInfo(dependToolName, dependToolConfig);
  }

  public setAttributeLockList(attributeLockList: string[]) {
    this.attributeLockList = attributeLockList;
    this.render();
  }

  public setConfig(config: ToolConfig) {
    this.config = CommonToolUtils.jsonParser(config);
  }

  public setDataInjectionAtCreation(dataInjectionAtCreation: TDataInjectionAtCreateion) {
    this.dataInjectionAtCreation = dataInjectionAtCreation;
  }

  public setRenderEnhance(renderEnhance: IRenderEnhance) {
    this.renderEnhance = renderEnhance;
  }

  /**
   * 进行图片旋转操作
   * @returns
   */
  public updateRotate() {
    // 依赖情况下禁止旋转
    if (this.dependToolName) {
      this.emit('messageInfo', locale.getMessagesByLocale(EMessage.NoRotateInDependence, this.lang));
      return false;
    }

    // 有数据情况下禁止旋转
    if (this.dataList.length > 0) {
      this.emit('messageInfo', locale.getMessagesByLocale(EMessage.NoRotateNotice, this.lang));
      return false;
    }

    // 更改当前图片的旋转方式
    const rotate = MathUtils.getRotate(this.basicImgInfo.rotate);
    this.basicImgInfo.rotate = rotate;
    this.initImgPos({ useCachedPosition: false });

    // 触发外层 result 的更改
    this.emit('updateResult');
  }

  /** 获取当前属性颜色 */
  public getColor(attribute = '', config = this.config) {
    if (config?.attributeConfigurable === true && this.style.attributeColor) {
      const attributeIndex = AttributeUtils.getAttributeIndex(attribute, this.allAttributes ?? []) + 1;
      return this.style.attributeColor[attributeIndex];
    }
    const { color, toolColor } = this.style;
    if (toolColor) {
      return toolColor[color];
    }
    return styleDefaultConfig.toolColor['1'];
  }

  public getLineColor(attribute = '') {
    if (this.config?.attributeConfigurable === true) {
      const attributeIndex = AttributeUtils.getAttributeIndex(attribute, this.allAttributes ?? []) + 1;
      return this.style.attributeLineColor ? this.style.attributeLineColor[attributeIndex] : '';
    }
    const { color, lineColor } = this.style;
    if (color && lineColor) {
      return lineColor[color];
    }
    return '';
  }

  /**
   * Get the textIconSvg by attribute.
   * @param attribute
   */
  public getTextIconSvg(attribute = '') {
    return AttributeUtils.getTextIconSvg(
      attribute,
      this.config?.attributeList,
      this.config.attributeConfigurable,
      this.baseIcon,
    );
  }

  /**
   * 判定点是否在边界外
   * @param coordinate
   * @param currentPosition
   * @returns boolean
   */
  public isPointOutOfBoundary(coordinate: ICoordinate, currentPosition: ICoordinate) {
    const { zoom, basicResult, imgInfo } = this;

    if (basicResult && zoom) {
      // brX: basicResult.x
      const { x: brX, y: brY, width: brW, height: brH } = basicResult;
      const { x, y } = coordinate;
      const { x: cX, y: cY } = currentPosition;

      return x - cX > (brX + brW) * zoom || x - cX < brX * zoom || y - cY > (brY + brH) * zoom || y - cY < brY * zoom;
    } else {
      const { x, y } = coordinate;
      const { x: cX, y: cY } = currentPosition;
      const { width, height } = imgInfo!;

      return x - cX > width || x - cX < 0 || y - cY > height || y - cY < 0;
    }
  }

  public clearInvalidPage() {
    if (this._invalidDOM && this.container && this.container.contains(this._invalidDOM)) {
      this.container.removeChild(this._invalidDOM);
      this._invalidDOM = undefined;
    }
  }

  public renderInvalidPage() {
    if (!this.container || this._invalidDOM) {
      return;
    }

    this._invalidDOM = RenderDomUtils.renderInvalidPage(this.container, this.size, this.lang);
  }

  public renderOtherAnnotation() {
    const thickness = this.style?.width ?? 2;
    // if (this.forbidBasicResultRender) {
    //   return;
    // }
    if (this.prevResultList && this.prevResultList?.length > 0) {
      for (let i = 0; i < this.prevResultList.length; i++) {
        const currentReulst = this.prevResultList[i];
        switch (currentReulst.toolName) {
          case EToolName.Rect: {
            if (currentReulst.result && currentReulst.result.length > 0) {
              currentReulst.result.forEach((item) => {
                if (item.isVisible) {
                  const toolColor = this.getColor(item.attribute);
                  const color = item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke;
                  const transformRect = AxisUtils.changeRectByZoom(item, this.zoom, this.currentPos);
                  const rectSize = `${Math.round(item.width)} * ${Math.round(item.height)}`;
                  const textSizeWidth = rectSize.length * 7;
                  DrawUtils.drawRect(
                    this.canvas,
                    // @ts-ignore
                    transformRect,
                    {
                      isShowOrder: this.isShowOrder,
                      order: item.order,
                      color,
                      thickness,
                      allAttributesMap: this.allAttributesMap,
                    },
                  );
                  if (this.isShowAttributeText) {
                    const marginTop = 0;
                    const textWidth = Math.max(20, transformRect.width - textSizeWidth);
                    DrawUtils.drawText(
                      this.canvas,
                      { x: transformRect.x, y: transformRect.y + transformRect.height + 20 + marginTop },
                      item.textAttribute,
                      {
                        color: color,
                        textMaxWidth: textWidth,
                        // ...DEFAULT_TEXT_SHADOW,
                      },
                    );
                  }
                }
              });
            }
            break;
          }
          case EToolName.Polygon: {
            currentReulst.result.forEach((item) => {
              if (item.isVisible) {
                const toolColor = this.getColor(item.attribute);
                const transformPointList = AxisUtils.changePointListByZoom(
                  item.pointList || [],
                  this.zoom,
                  this.currentPos,
                );
                DrawUtils.drawPolygonWithFillAndLine(
                  this.canvas,
                  AxisUtils.changePointListByZoom(item.pointList, this.zoom, this.currentPos),
                  {
                    fillColor: item.valid ? toolColor?.valid.fill : toolColor?.invalid.fill,
                    strokeColor: item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke,
                    isClose: true,
                    thickness,
                  },
                );
                let showText = this.allAttributesMap.get(item.attribute) || item.attribute;
                if (this.isShowOrder) {
                  showText = `${item.order} ${showText}`;
                }

                DrawUtils.drawText(this.canvas, transformPointList[0], showText, {
                  color: item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke,
                  ...DEFAULT_TEXT_OFFSET,
                });
                if (this.isShowAttributeText) {
                  const endPoint = transformPointList[transformPointList.length - 1];
                  if (endPoint && endPoint.x) {
                    DrawUtils.drawText(
                      this.canvas,
                      { x: endPoint.x + TEXT_ATTRIBUTE_OFFSET.x, y: endPoint.y + TEXT_ATTRIBUTE_OFFSET.y },
                      item.textAttribute,
                      {
                        color: item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke,
                        ...DEFAULT_TEXT_OFFSET,
                      },
                    );
                  }
                }
              }
            });
            break;
          }
          case EToolName.Line: {
            // @ts-ignore
            currentReulst.result.forEach((item) => {
              if (item.isVisible) {
                const toolColor = this.getColor(item.attribute);
                // const toolColor = item && this.getLineColorByAttribute(item);
                const transformPointList = AxisUtils.changePointListByZoom(
                  item.pointList || [],
                  this.zoom,
                  this.currentPos,
                );
                DrawUtils.drawLineWithPointList(
                  this.canvas,
                  // @ts-ignore
                  AxisUtils.changePointListByZoom(item.pointList, this.zoom, this.currentPos),
                  {
                    color: item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke,
                    thickness,
                  },
                );
                let showText = this.allAttributesMap.get(item.attribute) || item.attribute;
                if (this.isShowOrder) {
                  showText = `${item.order} ${showText}`;
                }
                DrawUtils.drawText(this.canvas, transformPointList[0], showText, {
                  color: item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke,
                  ...DEFAULT_TEXT_OFFSET,
                });
                if (this.isShowAttributeText) {
                  const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
                  ctx?.save();
                  // this.ctx.font = 'italic bold 14px SourceHanSansCN-Regular';
                  ctx.font = DEFAULT_FONT;
                  ctx.fillStyle = item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke;
                  ctx.strokeStyle = item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke;
                  DrawUtils.wrapText(
                    this.canvas,
                    item.textAttribute,
                    transformPointList[1].x - LINE_ORDER_OFFSET.x,
                    transformPointList[1].y - LINE_ORDER_OFFSET.y,
                    200,
                  );
                }
              }
            });
            break;
          }
          case EToolName.Point: {
            // @ts-ignore
            if (currentReulst.result && currentReulst.result.length > 0) {
              currentReulst.result.forEach((item) => {
                if (item.isVisible) {
                  const { width = 2 } = this.style;
                  const transformPoint = AxisUtils.changePointByZoom(item, this.zoom, this.currentPos);
                  const points = AxisUtils.changeRectByZoom(item, this.zoom, this.currentPos);
                  const toolColor = this.getColor(item.attribute);
                  DrawUtils.drawCircle(this.canvas, points, width, {
                    startAngleDeg: 0,
                    endAngleDeg: 360,
                    thickness: 1,
                    color: item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke,
                    fill: 'transparent',
                  });
                  let showText = this.allAttributesMap.get(item.attribute) || item.attribute;
                  if (this.isShowOrder) {
                    showText = `${item.order}  ${showText}`;
                  }

                  DrawUtils.drawText(
                    this.canvas,
                    { x: transformPoint.x + width / 2 + 4, y: transformPoint.y - width - 4 },
                    showText,
                    {
                      textAlign: 'center',
                      color: item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke,
                    },
                  );

                  if (this.isShowAttributeText) {
                    DrawUtils.drawText(
                      this.canvas,
                      { x: transformPoint.x + width, y: transformPoint.y + width + 24 },
                      item.textAttribute,
                      {
                        color: item.valid ? toolColor?.valid.stroke : toolColor?.invalid.stroke,
                        ...DEFAULT_TEXT_OFFSET,
                      },
                    );
                  }
                }
              });
            }
            break;
          }
          case EToolName.Tag: {
            if (currentReulst.result && currentReulst.result.length > 0) {
              if (!(currentReulst.result?.length > 0)) {
                return;
              }
              const dom = document.createElement('div');
              const tagInfoList = TagUtils.getTagNameList(
                currentReulst?.result[0].result ?? {},
                this.config.tagConfigList,
              );
              dom.innerHTML =
                tagInfoList.reduce((acc: string, cur: { keyName: string; value: string[] }) => {
                  return `${acc}${cur.keyName}: ${cur.value.join(` 、 `)}\n`;
                }, '') ?? '';
              dom.setAttribute('id', 'tagToolTag');
              dom.setAttribute(
                'style',
                `
                  position: absolute;
                  top: 0;
                  right: 0;
                  z-index: 5;
                  padding: 0 20px;
                  font-size: 15px;
                  color: white;
                  text-align: right;
                  line-height: 32px;
                  white-space: pre;
                  background: rgba(102, 111, 255, 1);
                  opacity: 0.6;
                  clear: both;
                `,
              );
              const preTagDom = document.getElementById('tagToolTag');
              if (!this.canvas?.parentNode?.contains(preTagDom)) {
                this.canvas?.parentNode?.appendChild(dom);
              }
            }
            break;
          }
          default: {
            // empty
          }
        }
      }
    }
  }

  public renderBasicCanvas() {
    if (!this.basicCanvas) {
      return;
    }
    this.clearBasicCanvas();
    this.drawImg();

    //  无多步骤，无需依赖，因此注释
    // if (this.basicResult && this.dependToolName) {
    //   switch (this.dependToolName) {
    //     case EToolName.Rect: {
    //       DrawUtils.drawRect(
    //         this.basicCanvas,
    //         AxisUtils.changeRectByZoom(this.basicResult, this.zoom, this.currentPos),
    //         {
    //           color: 'rgba(204,204,204,1.00)',
    //           thickness,
    //         },
    //       );
    //       break;
    //     }

    //     case EToolName.Polygon: {
    //       DrawUtils.drawPolygonWithFillAndLine(
    //         this.basicCanvas,
    //         AxisUtils.changePointListByZoom(this.basicResult.pointList, this.zoom, this.currentPos),
    //         {
    //           fillColor: 'transparent',
    //           strokeColor: 'rgba(204,204,204,1.00)',
    //           isClose: true,
    //           thickness,
    //         },
    //       );

    //       break;
    //     }

    //     case EToolName.Line: {
    //       DrawUtils.drawLineWithPointList(
    //         this.basicCanvas,
    //         AxisUtils.changePointListByZoom(this.basicResult.pointList, this.zoom, this.currentPos),
    //         {
    //           color: 'rgba(204,204,204,1.00)',
    //           thickness,
    //         },
    //       );

    //       break;
    //     }

    //     default: {
    //       //
    //     }
    //   }
    // }
  }

  public render() {
    // const haPre = localStorage.getItem('haPrevList');
    if (!this.canvas || !this.ctx || !this.imgNode || !this.renderReady) {
      return;
    }
    this.clearCanvas();
    this.renderOtherAnnotation();
  }

  // 触发外界 style 的样式
  public changeStyle(newAttribute = this.defaultAttribute) {
    this.emit('changeStyle', { attribute: newAttribute });
  }
}
