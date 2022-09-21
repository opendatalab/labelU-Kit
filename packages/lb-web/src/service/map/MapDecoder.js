import { toByteArray } from './b64';
import { MapMode, MapElemKey, MPVirtualWall, MapDef, MPForbiddenZone, MPRectZone, MPAreaZone } from './MapDefined';

class MPDecoderBase {
  constructor() {
    // this.trace = '';
    // this.map = '';
  }
  decoderMap(strMap) {}
  decoderTrace(strTrace) {}
}

class M7Decoder extends MPDecoderBase {
  constructor() {
    super();
  }
  /**return: object like:{
   * rect:{
   *  left:leftValue,
   *  right:value(Int)
   *  bottom:value(Int)
   *  top:value(Int)
   * },
   *
   * mapDecodedData:[]
   *
   * } */
  decoderMap(strMap) {
    if (strMap == undefined || strMap == null || strMap == '') {
      return {
        rect: undefined,
        mapData: undefined
      };
    }
    /**对http获取到的地图数据做简单解析，获取地图的尺寸 */
    var index;
    var info_map = strMap.indexOf(' ');
    if (info_map <= 0) return {};
    strMap = strMap.substring(info_map + 1);

    var r = { left: 0, bottom: 0, right: 0, top: 0 };
    for (var i = 0; i < 5; i++) {
      var spaceIndex = strMap.indexOf(' ');
      var data = strMap.substring(0, spaceIndex);
      switch (i) {
        case 1:
          r.left = parseInt(data);
          break;
        case 2:
          r.bottom = parseInt(data);
          break;
        case 3:
          r.right = parseInt(data);
          break;
        case 4:
          r.top = parseInt(data);
          break;
        default:
          break;
      }
      strMap = strMap.substring(spaceIndex + 1);
    }
    //剔除掉尺寸部分后是实际的地图数据，进行b64解码
    var mapDecoded = toByteArray(strMap);
    if (mapDecoded[0] == 0xaa) {
      for (let m = 1; m < mapDecoded.length; m++) {
        if (mapDecoded[m] > 100) {
          mapDecoded[m] = 100;
        }
        switch (mapDecoded[m]) {
          case 0: {
            mapDecoded[m] = 0x0;
            break;
          }
          case 1: {
            mapDecoded[m] = 0x10;
            break;
          }
          case 2: {
            mapDecoded[m] = 0x20;
            break;
          }
          case 3: {
            mapDecoded[m] = 0x30;
            break;
          }
          case 4: {
            mapDecoded[m] = 0x40;
            break;
          }
          case 5: {
            mapDecoded[m] = 0x50;
            break;
          }
          case 6: {
            mapDecoded[m] = 0x60;
            break;
          }
          case 7: {
            mapDecoded[m] = 0x70;
            break;
          }
          case 8: {
            mapDecoded[m] = 0x80;
            break;
          }
          case 9: {
            mapDecoded[m] = 0x90;
            break;
          }
          case 10: {
            mapDecoded[m] = 0xa0;
            break;
          }
          case 11: {
            mapDecoded[m] = 0xb0;
            break;
          }
          case 12: {
            mapDecoded[m] = 0xc0;
            break;
          }
          case 13: {
            mapDecoded[m] = 0xd0;
            break;
          }
          case 14: {
            mapDecoded[m] = 0xe0;
            break;
          }
          case 15: {
            mapDecoded[m] = 0xf0;
            break;
          }
        }
      }
    }
    return {
      rect: {
        left: r.left,
        right: r.right,
        bottom: r.bottom,
        top: r.top
      },
      mapData: mapDecoded
    };
  }
  decoderTrace(strTrace) {
    if (strTrace == undefined || strTrace == null || strTrace == '') {
      return { mapTraceArr: [] };
    }
    //b64解码
    return {
      mapTraceArr: toByteArray(strTrace)
    };
  }
  handleAreaData(data) {
    let mapData = data.mapInfo;
    let info_map = mapData.indexOf(' ');
    mapData = mapData.substring(info_map + 1);
    let rect = { left: 0, bottom: 0, right: 0, top: 0 };
    let roomcount, roomid, roomleft, roomtop, roomright, roombottom, roomObj;
    for (let i = 0; i < 7; i++) {
      let spaceIndex = mapData.indexOf(' ');
      let data = mapData.substring(0, spaceIndex);
      switch (i) {
        case 0:
          break;
        case 1:
          break;
        case 2:
          rect.left = parseInt(data);
          break;
        case 3:
          rect.bottom = parseInt(data);
          break;
        case 4:
          rect.right = parseInt(data);
          break;
        case 5:
          rect.top = parseInt(data);
          break;
        case 6:
          roomcount = parseInt(data);
          break;
        default:
          break;
      }
      mapData = mapData.substring(spaceIndex + 1);
    }
    let roomzones = [];
    let roomnamekeyvalue = data.roomNameInfo && JSON.parse(data.roomNameInfo);
    for (let ii = 0; ii < roomcount * 5; ii++) {
      let spaceIndex = mapData.indexOf(' ');
      if (spaceIndex == 0) {
        spaceIndex = 1;
      }
      let rdata = mapData.substring(0, spaceIndex);
      switch (ii % 5) {
        case 0:
          roomid = parseInt(rdata);
          break;
        case 1:
          roomleft = parseInt(rdata);
          break;
        case 2:
          roomtop = parseInt(rdata);
          break;
        case 3:
          roomright = parseInt(rdata);
          break;
        case 4:
          roombottom = parseInt(rdata);
          if (ii == 0) continue;
          if (roomnamekeyvalue) {
            roomObj = new MPAreaZone(roomleft, roombottom, roomright, roomtop, roomid, roomnamekeyvalue[roomid]);
          } else {
            roomObj = new MPAreaZone(roomleft, roombottom, roomright, roomtop, roomid, '');
          }
          roomzones.push(roomObj);
          break;
      }
      mapData = mapData.substring(spaceIndex + 1);
    }

    let areadata = toByteArray(mapData);
    for (let m = 0; m < areadata.length; m++) {
      switch (areadata[m]) {
        case 0: {
          areadata[m] = 0x0;
          break;
        }
        case 1: {
          areadata[m] = 0x10;
          roomObj.hexid = 0x10;
          break;
        }
        case 2: {
          areadata[m] = 0x20;
          roomObj.hexid = 0x20;
          break;
        }
        case 3: {
          areadata[m] = 0x30;
          roomObj.hexid = 0x30;
          break;
        }
        case 4: {
          areadata[m] = 0x40;
          roomObj.hexid = 0x40;
          break;
        }
        case 5: {
          areadata[m] = 0x50;
          roomObj.hexid = 0x50;
          break;
        }
        case 6: {
          areadata[m] = 0x60;
          roomObj.hexid = 0x60;
          break;
        }
        case 7: {
          areadata[m] = 0x70;
          roomObj.hexid = 0x70;
          break;
        }
        case 8: {
          areadata[m] = 0x80;
          roomObj.hexid = 0x80;
          break;
        }
        case 9: {
          areadata[m] = 0x90;
          roomObj.hexid = 0x90;
          break;
        }
        case 10: {
          areadata[m] = 0xa0;
          roomObj.hexid = 0xa0;
          break;
        }
        case 11: {
          areadata[m] = 0xb0;
          roomObj.hexid = 0xb0;
          break;
        }
        case 12: {
          areadata[m] = 0xc0;
          break;
        }
        case 13: {
          areadata[m] = 0xd0;
          break;
        }
        case 14: {
          areadata[m] = 0xe0;
          break;
        }
        case 15: {
          areadata[m] = 0xf0;
          break;
        }
      }
    }
    return {
      rect: {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom
      },
      mapData: areadata,
      roomZones: roomzones
    };
  }
}
export const MAP_TYPE = {
  MAP_TYPE_M7: 0,
  MAP_TYPE_OTHER: 1
};
let decoderCreater = model => {
  //console.log('model:' + model);
  if (MAP_TYPE.MAP_TYPE_M7 == model) {
    return new M7Decoder();
  }

  //异常
  throw '禁止对未知的地图类型进行解码类的实例化';
};

export { decoderCreater };
