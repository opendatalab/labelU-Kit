import { MapMode, MapElemKey, MapAction, MapType } from './MapDefined';

export var mapHelper = {
  // 转换收到的原始路径数据(ascII编码的数据)成路径数值数组
  parseToTraceArray: function (data) {
    const length = data.length;
    const ret = [];

    let number = '';
    let item = [];
    for (let i = 0; i < length; i++) {
      if (data[i] == 44) {
        if (item.length == 2) {
          item.push(number);
          number = '';

          ret.push(item);
          item = [];
        } else {
          item.push(parseInt(number));
          number = '';
        }
      } else {
        number += String.fromCharCode(data[i]);
      }
    }
    return ret;
  },
  colorManager: function (nmask, colors, blend) {
    this.needmask = nmask;
    this.colorMap = [];
    this.blend = !!blend;
    for (var i = 0, color; i < colors.length; i++) {
      color = colors[i];
      this.colorMap[color[0]] = color[1];
    }

    function blendColor(maskColor, baseColor) {
      var baseA = baseColor[3] / 255;
      var maskA = maskColor[3] / 255;

      var R = maskColor[0] * maskA + baseColor[0] * baseA * (1 - maskA);
      var G = maskColor[1] * maskA + baseColor[1] * baseA * (1 - maskA);
      var B = maskColor[2] * maskA + baseColor[2] * baseA * (1 - maskA);

      var Alpha = 1 - (1 - maskA) * (1 - baseA);
      R = R / Alpha;
      G = G / Alpha;
      B = B / Alpha;
      Alpha = Alpha * 255;
      return [R, G, B, Alpha];
    }

    this.getColor = function (b) {
      return this.colorMap[b];
    };

    this.setColor = function (b, data, pos) {
      var mask = b instanceof Array ? b : this.getColor(b);
      var color = this.blend ? blendColor(this.needmask, mask) : mask;
      if (color) {
        data[pos] = color[0];
        data[pos + 1] = color[1];
        data[pos + 2] = color[2];
        data[pos + 3] = color[3];
        return true;
      }
      return false;
    };
    return this;
  },
  queryMapElemnts: function (mode) {
    //通过 mode 控制 MapElements
    switch (mode) {
      case MapMode.MainPage:
        return [
          MapElemKey.MAP_MAP_KEY,
          MapElemKey.MAP_TRACE_KEY,
          MapElemKey.MAP_RECT_KEY,
          MapElemKey.MAP_RECT_CACHE_KEY,
          MapElemKey.MAP_TARGET_KEY,
          MapElemKey.MAP_VIRTUALWALL_KEY,
          MapElemKey.MAP_FORBIDDEN_KEY,
          MapElemKey.MAP_MOPFORBIDDEN_KEY,
          MapElemKey.MAP_ROBOT_KEY,
          MapElemKey.MAP_CHARGEPILE_KEY
        ];
      case MapMode.EditPage:
        return [
          MapElemKey.MAP_MAP_KEY,
          MapElemKey.MAP_VIRTUALWALL_KEY,
          MapElemKey.MAP_FORBIDDEN_KEY,
          MapElemKey.MAP_MOPFORBIDDEN_KEY,
          MapElemKey.MAP_ROBOT_KEY,
          MapElemKey.MAP_CHARGEPILE_KEY,
          MapElemKey.MAP_VIRTUALWALLFORBIDDEN_KEY
        ];
      case MapMode.RectPage:
        return [
          MapElemKey.MAP_MAP_KEY,
          MapElemKey.MAP_VIRTUALWALL_KEY,
          MapElemKey.MAP_FORBIDDEN_KEY,
          MapElemKey.MAP_MOPFORBIDDEN_KEY,
          MapElemKey.MAP_RECT_KEY,
          MapElemKey.MAP_ROBOT_KEY,
          MapElemKey.MAP_CHARGEPILE_KEY
        ];
      case MapMode.TargetPage:
        return [
          MapElemKey.MAP_MAP_KEY,
          MapElemKey.MAP_TARGET_TRACE_KEY,
          MapElemKey.MAP_TRACE_KEY,
          MapElemKey.MAP_VIRTUALWALL_KEY,
          MapElemKey.MAP_FORBIDDEN_KEY,
          MapElemKey.MAP_MOPFORBIDDEN_KEY,
          MapElemKey.MAP_TARGET_KEY,
          MapElemKey.MAP_ROBOT_KEY,
          MapElemKey.MAP_CHARGEPILE_KEY
        ];
      case MapMode.MgrPage:
        return [
          MapElemKey.MAP_MAP_KEY,
          MapElemKey.MAP_VIRTUALWALL_KEY,
          MapElemKey.MAP_FORBIDDEN_KEY,
          MapElemKey.MAP_MOPFORBIDDEN_KEY
        ];
      case MapMode.RecordPage:
        return [
          MapElemKey.MAP_MAP_KEY,
          MapElemKey.MAP_TRACE_KEY,
          MapElemKey.MAP_VIRTUALWALL_KEY,
          MapElemKey.MAP_FORBIDDEN_KEY,
          MapElemKey.MAP_MOPFORBIDDEN_KEY,
          MapElemKey.MAP_ROBOT_KEY
        ];
      case MapMode.RoomPage:
        return [
          MapElemKey.MAP_MAP_KEY,
          MapElemKey.MAP_VIRTUALWALL_KEY,
          MapElemKey.MAP_FORBIDDEN_KEY,
          MapElemKey.MAP_MOPFORBIDDEN_KEY
        ];
      case MapMode.RoomPageInOrder:
        return [
          MapElemKey.MAP_MAP_KEY,
          MapElemKey.MAP_VIRTUALWALL_KEY,
          MapElemKey.MAP_FORBIDDEN_KEY,
          MapElemKey.MAP_MOPFORBIDDEN_KEY
        ];
      case MapMode.RoomEditPage:
        return [MapElemKey.MAP_MAP_KEY, MapElemKey.MAP_SPLITLINE_KEY];
      default:
        return [];
    }
  },
  //查询地图支持的动作
  queryMapAction: function (mode) {
    if (mode == MapMode.MainPage) {
      return [MapAction.MAP_MOVE, MapAction.MAP_PINCH];
    } else if (mode == MapMode.EditPage) {
      return [MapAction.MAP_TAP, MapAction.MAP_MOVE, MapAction.MAP_PINCH];
    }
    return [];
  },
  //查询可编辑的内容，主要是三种清扫模式，地图编辑，分区编辑下
  queryEditableEles: function (mode) {
    if (mode == MapMode.EditPage) {
      return [MapElemKey.MAP_VIRTUALWALL_KEY, MapElemKey.MAP_FORBIDDEN_KEY, MapElemKey.MAP_MOPFORBIDDEN_KEY];
    } else if (mode == MapMode.RectPage) {
      return [MapElemKey.MAP_RECT_KEY];
    } else if (mode == MapMode.TargetPage) {
      return [MapElemKey.MAP_TARGET_KEY];
    } else if (mode == MapMode.RoomEditPage) {
      return [MapElemKey.MAP_SPLITLINE_KEY];
    } else if (mode == MapMode.MainPage) {
      // return [];
      return [MapElemKey.MAP_RECT_CACHE_KEY, MapElemKey.MAP_TARGET_KEY];
    }
    return [];
  },
  /*
   *在mode这个模式下，有没有elementKey这种元素，返回true或者false
   */
  queryElem(mode, elementKey) {
    var elems = this.queryMapElemnts(mode);
    for (let ele in elems) {
      if (elementKey == elems[ele]) {
        return true;
      }
    }
    return false;
  },
  /**actionKey:MapAction */
  queryAction: function (mode, actionKey) {
    var acts = this.queryMapAction(mode);
    for (let act in acts) {
      if (actionKey == acts[act]) {
        return true;
      }
    }
    return false;
  },
  /**elementKey:MapElemKey */
  queryEditableEle: function (mode, elementKey) {
    var edtEles = this.queryEditableEles(mode);
    for (let edtEle in edtEles) {
      if (elementKey == edtEles[edtEle]) {
        return true;
      }
    }
    return false;
  },
  /**使所有虚拟墙为非编辑状态
   * @return 虚拟墙列表
   */
  disableAllVM: function (walls) {
    walls.forEach(element => {
      if (element.isEdit) {
        element.isEdit = false;
      }
    });
    return walls;
  },
  /**使所有虚拟墙为非编辑状态
   * @return 虚拟墙列表
   */
  disableAllSplitLine: function (walls) {
    walls.forEach(element => {
      if (element.isEdit) {
        element.isEdit = false;
      }
    });
    return walls;
  },
  /**使所有禁区为非编辑状态
   * @return 禁区列表
   */
  disableAllFD: function (forbiddens) {
    forbiddens.forEach(element => {
      if (element.isEdit) {
        element.isEdit = false;
      }
    });
    return forbiddens;
  },
  /*
   * 在pageMode这个模式下，即有elementKey元素，又有对elementKey元素的编辑权限
   */
  hasElemAndEditable(pageMode, elementKey) {
    return this.queryElem(pageMode, elementKey) && this.queryEditableEle(pageMode, elementKey);
  },
  /*
   * 在pageMode这个模式下，即有elementKey元素，但无对elementKey元素的编辑权限
   */
  hasElemAndDiseditable(pageMode, elementKey) {
    return this.queryElem(pageMode, elementKey) && !this.queryEditableEle(pageMode, elementKey);
  },
  //判断当前数据来自与vuex还是父组件
  resourceIsBasedVuex(pageMode) {
    if (
      pageMode == MapMode.RecordPage ||
      pageMode == MapMode.MgrPage ||
      pageMode == MapMode.RoomPage ||
      pageMode == MapMode.RoomEditPage ||
      pageMode == MapMode.RoomPageInOrder
    ) {
      return false;
    }
    return true;
  },
  /*
   * 判断地图种类：
   * （1）普通类型：MainPage|RectPage|TargetPage|EditPage|MgrPage|RecordPage
   * （2）分区地图：RoomPage| RoomEditPage | RoomPageInOrder
   */
  getMapTypeBaseMapMoode(mapMode) {
    if (mapMode == MapMode.RoomPage || mapMode == MapMode.RoomEditPage || mapMode == MapMode.RoomPageInOrder) {
      return MapType.ROOM;
    }
    return MapType.NORMAL;
  }
};
