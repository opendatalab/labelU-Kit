/**
 * AnnotationEngine 标注引擎 - 各类标注工具管理
 */

import type { EToolName } from '@/constant/tool';
import { getConfig, styleDefaultConfig } from '@/constant/defaultConfig';
import CommonToolUtils from '@/utils/tool/CommonToolUtils';
import type { IPolygonData } from '@/types/tool/polygon';
import { ELang } from '@/constant/annotation';
import type { TextAttribute, ToolConfig } from '@/interface/config';
import type { ISize } from '@/types/tool/common';
import type { IRect } from '@/types/tool/rectTool';
import type { IRenderEnhance } from '@/types/tool/annotation';
import type { ToolResult } from '@/interface/result';

export interface IProps {
  isShowOrder: boolean;
  container: HTMLElement;
  size: ISize;
  toolName: EToolName;
  imgNode?: HTMLImageElement; // 展示图片的内容
  config?: ToolConfig; // 任务配置
  style?: any;
  tagConfigList: TextAttribute[];
  allAttributesMap: Map<string, any>;
}

const loadImage = (imgSrc: string) => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'Anonymous';
    img.onerror = (e) => {
      console.error(e);
      reject(img);
    };
    img.src = imgSrc;
    img.onload = () => {
      resolve(img);
    };
  });
};

export default class AnnotationEngine {
  public toolInstance: any; // 用于存储当前工具实例

  public toolName: EToolName;

  public i18nLanguage: 'en' | 'cn'; // 存储当前 i18n 初始化数据

  private container: HTMLElement; // 当前结构绑定 container

  private size: ISize;

  private isShowOrder: boolean;

  private config: ToolConfig; // 定义 TODO！！

  private style: any; // 定义 TODO！！

  private tagConfigList: TextAttribute[]; // 配置tag 信息，工具共享一套tag

  private imgNode?: HTMLImageElement;

  private allAttributesMap: Map<string, any>;

  // 工具内依赖的记录
  private basicResult?: IRect | IPolygonData; // 用于存储当前的标注结果的依赖物体结果状态

  private dependToolName?: EToolName;

  constructor(props: IProps) {
    this.isShowOrder = props.isShowOrder;
    this.tagConfigList = props.tagConfigList;
    this.allAttributesMap = props.allAttributesMap;
    this.container = props.container;
    this.size = props.size;
    this.toolName = props.toolName;
    this.imgNode = props.imgNode;
    this.i18nLanguage = 'cn'; // 默认为中文（跟 basicOperation 内同步）
    const tmpObjectConfig = props.config ?? getConfig(props.toolName); // 默认配置
    let attributeArr: any[] = [];
    if (
      (props.toolName === 'rectTool' ||
        props.toolName === 'pointTool' ||
        props.toolName === 'lineTool' ||
        props.toolName === 'polygonTool') &&
      props.config &&
      typeof props.config === 'object' &&
      Object.keys(props.config).indexOf('attributes') >= 0
    ) {
      // @ts-ignore
      attributeArr = props.config?.attributes;
    }

    this.config = {
      ...tmpObjectConfig,
      attributeList: attributeArr,
      attributeMap: this.allAttributesMap.get(props.toolName),
      tagConfigList: props.tagConfigList,
    } as unknown as ToolConfig;
    this.style = props.style ?? styleDefaultConfig; // 设置默认操作
    this._initToolOperation();
  }

  /**
   * 同步各种基础类型信息
   * 1. imgNode （TODO，后续是否将 imgNode 放置在内部管理）
   * 2. size
   * 3. config
   * 4. style
   */

  /**
   * 设置当前工具类型
   * @param toolName
   * @param config
   */
  public setToolName(toolName: EToolName, config?: ToolConfig) {
    this.toolName = toolName;
    const defaultConfig = config || getConfig(toolName); // 防止用户没有注入配置
    this.config = defaultConfig as ToolConfig;
    this._initToolOperation();
  }

  public setImgSrc = async (imgSrc: string) => {
    const imgNode = await loadImage(imgSrc);
    if (!imgNode) {
      return;
    }

    this.setImgNode(imgNode as HTMLImageElement);
  };

  public setImgNode(
    imgNode: HTMLImageElement,
    basicImgInfo?: Partial<{
      valid: boolean;
      rotate: number;
    }>,
  ) {
    if (!this.toolInstance) {
      return;
    }
    this.imgNode = imgNode;
    this.toolInstance.setImgNode(imgNode, basicImgInfo);
  }

  public setSize(size: ISize) {
    this.size = size;
  }

  public setStyle(style: any) {
    this.style = style;

    this.toolInstance.setStyle(style);
  }

  /**
   * 初始化工具实例
   * @returns
   */
  private _initToolOperation() {
    if (this.toolInstance) {
      this.toolInstance.destroy();
    }

    const ToolOperation: any = CommonToolUtils.getCurrentOperation(this.toolName);
    if (!ToolOperation) {
      return;
    }
    const defaultData = {
      container: this.container,
      size: this.size,
      config: this.config,
      drawOutSideTarget: false,
      style: this.style,
    };

    /**
     * 存储上层
     */
    if (this.imgNode) {
      Object.assign(defaultData, { imgNode: this.imgNode });
    }
    this.toolInstance = new ToolOperation(defaultData);

    // 实时同步语言
    this.setLang(this.i18nLanguage);
    this.toolInstance.init();
    // 设置是否显示顺序
    this.toolInstance.setIsShowOrder(this.isShowOrder);
    // 设置统一标签
    if (this.allAttributesMap) {
      this.toolInstance?.setAllAttributesMap(this.allAttributesMap);
    }
  }

  /**
   * 设置当前依赖物体渲染
   * @param dependToolName
   * @param basicResult
   */
  public setBasicInfo(dependToolName?: EToolName, basicResult?: IRect | IPolygonData) {
    this.dependToolName = dependToolName;
    this.basicResult = basicResult;

    this.toolInstance.setDependName(dependToolName);
    this.toolInstance.setBasicResult(basicResult);
    this.toolInstance.renderBasicCanvas();
  }

  /**
   * 设置此前工具绘制结果信息
   */
  public setPrevResultList(prevResultList: ToolResult[]) {
    this.toolInstance.setPrevResultList(prevResultList);
  }

  /**
   * 清空当前依赖
   */
  public clearBasicResult() {
    this.setBasicInfo();
  }

  /**
   * 禁止操作
   */
  public forbidOperation() {
    this.toolInstance.setForbidOperation(true);
  }

  /**
   * 触发操作
   */
  public launchOperation() {
    this.toolInstance.setForbidOperation(false);
  }

  /**
   * 快速将 i18n 定义的国际化版本对应到当前渲染实例内
   * @param i18nLanguage
   */
  public setLang(i18nLanguage: 'en' | 'cn') {
    // 同步跟进本地数据
    this.i18nLanguage = i18nLanguage;

    switch (i18nLanguage) {
      case 'cn':
        this.toolInstance.setLang(ELang.Zh);
        break;

      case 'en':
        this.toolInstance.setLang(ELang.US);
        break;

      default: {
        //
        break;
      }
    }
  }

  /**
   * 用于创建时的数据时的数据注入
   * @param dataInjectionAtCreation
   */
  public setDataInjectionAtCreation(dataInjectionAtCreation: any) {
    this.toolInstance.setDataInjectionAtCreation(dataInjectionAtCreation);
  }

  /**
   * 数据渲染增强操作
   * @param renderEnhance
   */
  public setRenderEnhance(renderEnhance: IRenderEnhance) {
    this.toolInstance.setRenderEnhance(renderEnhance);
  }
}
