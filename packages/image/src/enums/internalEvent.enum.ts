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

  /** 点击 */
  Click = '__click__',

  /** 渲染 */
  Render = '__render__',
}
