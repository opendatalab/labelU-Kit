/** 内部事件名列表 */
export enum EInternalEvent {
  /** 工具变更 */
  ToolChange = '__tool_change__',
  /** 拖拽开始 */
  PanStart = '__pan_start__',

  /** 拖拽中 */
  Pan = '__pan__',

  /** 鼠标滚轮事件 */
  Wheel = '__wheel__',

  /** 移动结束 */
  PanEnd = '__pan_end__',

  /** 鼠标移动 */
  MouseMove = '__mouse_move__',

  /** 鼠标按下左键移动 */
  LeftMouseMove = '__left_mouse_move__',

  /** 缩放中 */
  Zoom = '__zoom__',

  /** 图形对象移动 */
  AnnotationMove = '__annotation_move__',

  /** 鼠标左键按下 */
  LeftMouseDown = '__left_mouse_down__',

  /** 鼠标左键按下但没有选中的图形目标 */
  LeftMouseDownWithoutTarget = '__left_mouse_down_without_target__',

  /** 鼠标右键按下 */
  RightMouseDown = '__right_mouse_down__',

  /** 鼠标左键松开 */
  LeftMouseUp = '__left_mouse_up__',

  /** 鼠标右键松开 */
  RightMouseUp = '__right_mouse_up__',

  /** 右键松开时没有坐标变化 */
  RightMouseUpWithoutAxisChange = '__right_mouse_up_without_axis_change__',

  /** 左键松开时没有坐标变化 */
  LeftMouseUpWithoutAxisChange = '__left_mouse_up_without_axis_change__',

  /** 鼠标经过 */
  MouseOver = '__mouse_over__',

  /** 鼠标经过图形对象 */
  ShapeOver = '__shape_over__',

  /** 鼠标经过图形对象 */
  ShapeOut = '__shape_out__',

  /** 经过包围盒 */
  BBoxOver = '__bbox_over__',

  /** 在包围盒外 */
  BBoxOut = '__bbox_out__',

  /** 鼠标不在目标内 */
  MouseOut = '__mouse_out__',

  /** 无图形对象 */
  NoTarget = '__no_target__',

  /**
   * 坐标系发生变化
   * @description 包括坐标系的大小、缩放比例、偏移量等，是Move和Zoom的合并
   */
  AxisChange = '__axis_change__',

  /** 普通鼠标移动，没有坐标变化 */
  MouseMoveWithoutAxisChange = '__mouse_move_without_axis_change__',

  /** 坐标上松开鼠标，会携带是否移动过的标识 */
  AxisMouseUp = '__axis_mouse_up__',

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

  /** 左键点击已选中的标注 */
  Pick = '__pick__',

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
