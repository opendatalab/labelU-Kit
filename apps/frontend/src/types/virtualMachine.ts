export interface W11VirtualStatus {
  //工作状态
  work_status: string;
  //启动和停止类型
  action_type: string;
  //控制模式
  control_type: string;
  //（手动模式下）运行方向
  move_direction: string;
  //（自动模式下）自动类型
  work_mode: string;
  //风机设置
  fan_level: string;
  //清扫面积
  area: string;
  //水箱设置
  water_level: string;
  //语音控制
  voice_level: string;
  //是否有预约
  have_reserve_task: string;
  //电量：百分比
  battery_percent: string;
  //工作时间：分
  work_time: string;
  //故障协议适合型号
  warningProtocalType: string;
  //故障类型
  warningType: string;
  //故障信息
  warningInfo: string;
  //抹布检测
  has_mop: string;
  //地毯检测
  carpet_switch: string;
  //分区信息
  district_status: string;
  //清扫类型
  cleaning_type: string;
  //工作时间工作面积补充字段
  replenish: string;
  //精拖模式
  vibrate_mode: string;
  //震动托开关
  vibrate_switch: string;
  //电解水开关
  electrolyzed_water: string;
  //电解水状态
  electrolyzed_water_status: string;
  //升降拖开关和状态
  dustDragSwitch: string;
  //集尘次数设置
  dustTimes: string;
  //该轮集尘已清扫次数
  dustedTimes: string;
  //充电座类型
  chargeDockType: string;
  //集尘时间
  dust_time: string;
  //集尘状态
  dust_status: string;
  //蓝牙状态
  ble_pairing_status: string;
  //扫托模式
  mopMode: string;
  //水站故障
  station_work_error: string;
  //水站状态
  station_work_status: string;
  // 任务状态
  task_status: string;
}

export interface ApiMockData {
  uri: string;
  deviceId: string;
  sn8: string;
  versionId: string | number;
  params: string;
}

export interface StatusData {
  name: string;
  label: string;
  value: string | number;
}

export interface MapParams {
  deviceId: string;
  sn8: string;
  versionId: string;
}

export interface MapInfo extends MapParams {
  data: string;
  mapId: string;
  mapLength: number;
  currentTime: string;
  rate: number;
}

export interface PageList<T> {
  pageSize: number;
  currentPage: number;
  totalPage: number;
  list: T;
}

export interface MapData {
  data: string;
}

export interface MapVueInfo {
  map: any; // 地图信息
  locus: any; // 轨迹信息
  partirion: any; // 分区地图信息
  partition_name_desc: string; // 分区命名信息
  partition_no: string; // 分区号
  partition_name: string; // 分区名
  virtual_wall: string; // 虚拟墙信息
  restricted_area: string; // 禁区
  mopping_restricted_area: string; // 拖地禁区
  mode?: number; // 模式切换 1:主页地图模式；2：选区地图模式；4：分区清扫；5：编辑地图模式；6：地图相册模式；7清扫记录模式；8地图编辑
  charge_home: string; // 充电桩
  mapId?: string;
}

export interface CanvasMapData {
  mapData: number[];
  rect: Rect;
}

export interface Rect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface RateParams {
  rate: number;
  deviceId: string;
  versionId: string;
}
