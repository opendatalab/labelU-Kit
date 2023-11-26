/** 内部事件名列表 */
export enum EInternalEvent {
  /** 拖拽开始 */
  PanStart = '__pan_start__',

  /** 拖拽中 */
  Pan = '__pan__',

  /** 开始移动 */
  MoveStart = '__move_start__',

  /** 移动结束 */
  MoveEnd = '__move_end__',

  /** 移动中 */
  Move = '__move__',

  /** 缩放中 */
  Zoom = '__zoom__',

  /**
   * 坐标系发生变化
   * @description 包括坐标系的大小、缩放比例、偏移量等，是Move和Zoom的合并
   */
  AxisChange = '__axis_change__',

  /** 点击 */
  Click = '__click__',

  /** 右键 */
  RightClick = '__right_click__',

  /** 左键双击 */
  DblClick = '__right_double_click__',

  /** 渲染 */
  Render = '__render__',

  /** 悬浮事件 */
  Hover = '__hover__',

  /** 选中事件 */
  Select = '__select__',

  /** 取消选中事件 */
  UnSelect = '__un_select__',

  // ==================== 线条 ====================
  /** 线条点击 */
  LineClick = '__line_click__',

  /** 点点击 */
  PointClick = '__point_click__',
}
