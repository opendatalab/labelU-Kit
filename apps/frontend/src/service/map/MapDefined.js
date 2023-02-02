export class MPVirtualWall {
  constructor(startx, starty, endx, endy) {
    this.startX = parseInt(startx);
    this.startY = parseInt(starty);
    this.endX = parseInt(endx);
    this.endY = parseInt(endy);
    this.isEdit = false;
  }
}
export class MPForbiddenZone {
  /*禁区*/
  constructor(startx, starty, endx, endy) {
    this.left = startx;
    this.top = starty;
    this.right = endx;
    this.bottom = endy;
    this.width = Math.abs(endx - startx);
    this.height = Math.abs(endy - starty);
    this.isEdit = false;
  }
}
export class MPRectZone {
  /*划区*/
  constructor(startx, starty, endx, endy) {
    this.left = startx;
    this.top = starty;
    this.right = endx;
    this.bottom = endy;
    this.width = Math.abs(endx - startx);
    this.height = Math.abs(endy - starty);
    this.isEdit = false;
  }
}
export class MPTargetZone {
  /*划区*/
  constructor(startx, starty, endx, endy) {
    this.left = startx;
    this.top = starty;
    this.right = endx;
    this.bottom = endy;
    this.width = Math.abs(endx - startx);
    this.height = Math.abs(endy - starty);
    this.isEdit = false;
    this.x = (startx + endx) / 2;
    this.y = (starty + endy) / 2;
  }
}

export class MPSplitLine {
  constructor(startx, starty, endx, endy) {
    this.startX = parseInt(startx);
    this.startY = parseInt(starty);
    this.endX = parseInt(endx);
    this.endY = parseInt(endy);
    this.isEdit = false;
  }
}

export class MPAreaZone {
  /*划区*/
  constructor(startX, startY, endX, endY, roomid, rrname) {
    this.top = startY;
    this.bottom = endY;
    this.left = startX;
    this.right = endX;
    this.width = Math.abs(endX - startX);
    this.height = Math.abs(endY - startY);
    this.active = false;
    this.id = roomid;
    this.hexid = roomid << 4;
    this.name = rrname;
    this.startIndex = undefined;
    this.rowcount = undefined;
    this.selectX = undefined;
    this.selectY = undefined;
    this.isEdit = false;
  }
}
export var MapDef = {
  /**地图协议中标示虚拟墙的字串，http接口获得的*/
  PROTOCAL_VIRTUAL_WALL_KEY: 'line',
  /**地图协议中标示禁区的字串，http接口获得的*/
  PROTOCAL_FORBIDDENZONE_KEY: 'forbid_zone',
  PROTOCAL_PARSE_STRING_KEY: ' ',
  VIRTUAL_WALL_MAX: 7,
  SPLIT_LINE_MAX: 1,
  FORBIDDEN_MAX: 4,
  MOPFORBIDDEN_MAX: 4,
  RECT_MAX: 5,
  TARGET_MAX: 1,
};
export const MapMode = {
  //未定义模式
  UndefinedPage: 0,
  //主页地图模式
  MainPage: 1,
  //划区地图模式
  RectPage: 2,
  //目标清扫地图模式
  TargetPage: 3,
  //分区清扫地图模式
  RoomPage: 4,
  //编辑地图模式
  EditPage: 5,
  //地图管理页面的地图模式
  MgrPage: 6,
  //清扫记录展示地图模式
  RecordPage: 7,
  //分区编辑地图模式
  RoomEditPage: 8,
  //分区预约清扫地图模式
  RoomPageInOrder: 9,
};
/*
 * 判断地图种类：
 * （1）普通类型：MainPage|RectPage|TargetPage|EditPage|MgrPage|RecordPage
 * （2）分区地图：RoomPage| RoomEditPage
 */
export const MapType = {
  //普通地图
  NORMAL: 0,
  //分区地图
  ROOM: 1,
};
export const MapElemKey = {
  MAP_MAP_KEY: 'map',
  MAP_TRACE_KEY: 'trace',
  MAP_TARGET_TRACE_KEY: 'targetTrace',
  MAP_FORBIDDEN_KEY: 'forbidden',
  MAP_MOPFORBIDDEN_KEY: 'mopForbidden',
  MAP_VIRTUALWALL_KEY: 'virtualWall',
  MAP_CHARGEPILE_KEY: 'chargePosition',
  MAP_RECT_KEY: 'drawRect',
  MAP_RECT_CACHE_KEY: 'drawCacheRect',
  MAP_ROOM_KEY: 'roomInfo',
  MAP_TARGET_KEY: 'targetPosition',
  MAP_ROBOT_KEY: 'robotPosition',
  MAP_SPLITLINE_KEY: 'splitLine',
  MAP_VIRTUALWALLFORBIDDEN_KEY: 'virtualWallForbidden',
  MAP_SELECTED_ROOM_LIST_KEY: 'selectedRoomList',
};
export const MapAction = {
  MAP_TAP: 0,
  MAP_PINCH: 1,
  MAP_MOVE: 2,
  MAP_DOUBLE_TAP: 3,
};
//固定写死2倍率
//const dPixelRatio = 2;
export const MapSizeConfig = {
  CLIENT_WIDTH_FIX: 360,
  CLIENT_HEIGHT_FIX: 600,
  WIDTH_MARGIN: 50,
  HEIGHT_MARGIN: 154,
  //地图扩大的最大比例（显示区域变小）
  MAX_RATE: 3 * 2,
  //地图缩小的最大比例（显示区域变大）
  MIN_RATE: 0.6 * 2,
  tResScale: 2,
};
