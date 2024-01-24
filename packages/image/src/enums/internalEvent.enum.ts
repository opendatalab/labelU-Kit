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

  /** 按下键盘 */
  KeyDown = '__key_down__',

  /** 松开键盘 */
  KeyUp = '__key_up__',

  Space = '__space__',

  Delete = '__delete__',

  BackSpace = '__back_space__',

  /** 按下ESC */
  Escape = '__escape__',

  /** Ctrl */
  Control = '__control__',

  /** Alt */
  Alt = '__alt__',

  /** Shift */
  Shift = '__shift__',

  /** Command */
  Meta = '__meta__',

  /** 鼠标移动 */
  MouseMove = '__mouse_move__',

  /** 缩放中 */
  Zoom = '__zoom__',

  /** 图形对象移动 */
  AnnotationMove = '__annotation_move__',

  /** 鼠标左键按下 */
  LeftMouseDown = '__left_mouse_down__',

  /** 鼠标右键按下 */
  RightMouseDown = '__right_mouse_down__',

  /** 鼠标左键松开 */
  LeftMouseUp = '__left_mouse_up__',

  /** 鼠标右键松开 */
  RightMouseUp = '__right_mouse_up__',

  /** 右键松开时没有坐标变化 */
  RightMouseUpWithoutAxisChange = '__right_mouse_up_without_axis_change__',

  /** 鼠标经过图形对象 */
  ShapeOver = '__shape_over__',

  /** 鼠标经过图形对象 */
  ShapeOut = '__shape_out__',

  /** 经过包围盒 */
  MouseOver = '__mouse_over__',

  /** 在包围盒外 */
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

  /** 渲染 */
  Render = '__render__',

  /** 选中事件 */
  Select = '__select__',

  /** 取消选中事件 */
  UnSelect = '__un_select__',

  SlopeDown = '__slope_down__',
  SlopeMove = '__slope_move__',
  SlopeUp = '__slope_up__',

  ContactDown = '__contact_down__',
  ContactMove = '__contact_move__',
  ContactUp = '__contact_up__',

  ShapeCoordinateChange = '__shape_coordinate_change__',
}
