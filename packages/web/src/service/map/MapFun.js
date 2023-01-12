import { mapHelper } from './MapHelper';
import {
  MPTargetZone,
  MapElemKey,
  MPVirtualWall,
  MapDef,
  MPForbiddenZone,
  MPRectZone,
  MapSizeConfig,
  MPSplitLine
} from '@/service/Map/MapDefined';
import { DrawForbiden } from '@/BussinessComponents/VCBaseMapCanvas/service/drawForbiddenZone.js';
import { DrawVirtualWall } from '@/BussinessComponents/VCBaseMapCanvas/service/drawVirtualWall.js';
import store from '@/store';
const TARGET_RECT_WIDTH = 20;

/*默认禁区坐标列表 屏幕坐标*/
function defaultForbidden() {
  let fdArr = [];
  for (let index = 0; index < MapDef.FORBIDDEN_MAX; index++) {
    let startX = (MapSizeConfig.CLIENT_WIDTH_FIX * MapSizeConfig.tResScale) / 2 + index * 10 * MapSizeConfig.tResScale;
    let startY = (MapSizeConfig.CLIENT_HEIGHT_FIX * MapSizeConfig.tResScale) / 2 + index * 20 * MapSizeConfig.tResScale;
    let endX = startX + 100 * MapSizeConfig.tResScale;
    let endY = startY + 100 * MapSizeConfig.tResScale;
    fdArr.push({
      startx: startX,
      starty: startY,
      endx: endX,
      endy: endY
    });
  }
  return fdArr;
}

/*默认虚拟墙坐标列表 屏幕坐标*/
function defaultWMPos() {
  let vmArr = [];
  for (let index = 0; index < MapDef.VIRTUAL_WALL_MAX; index++) {
    let startX = (MapSizeConfig.CLIENT_WIDTH_FIX * MapSizeConfig.tResScale) / 2 + index * 10 * MapSizeConfig.tResScale;
    let startY = (MapSizeConfig.CLIENT_HEIGHT_FIX * MapSizeConfig.tResScale) / 2 + index * 20 * MapSizeConfig.tResScale;
    let endX = startX + 100 * MapSizeConfig.tResScale;
    let endY = startY;
    vmArr.push({
      startx: startX,
      starty: startY,
      endx: endX,
      endy: endY
    });
  }
  return vmArr;
}
/*默认地图分割线（目前就一条，数组元素就一个），屏幕坐标*/
function defaultSplitLine() {
  let vmArr = [];
  for (let index = 0; index < MapDef.SPLIT_LINE_MAX; index++) {
    let startX = (MapSizeConfig.CLIENT_WIDTH_FIX * MapSizeConfig.tResScale) / 2 + index * 10 * MapSizeConfig.tResScale;
    let startY = (MapSizeConfig.CLIENT_HEIGHT_FIX * MapSizeConfig.tResScale) / 2 + index * 20 * MapSizeConfig.tResScale;
    let endX = startX + 100 * MapSizeConfig.tResScale;
    let endY = startY;
    vmArr.push({
      startx: startX,
      starty: startY,
      endx: endX,
      endy: endY
    });
  }
  return vmArr;
}

/*默认划区坐标列表 屏幕坐标*/
function defaultRect() {
  let reArr = [];
  for (let index = 0; index < MapDef.RECT_MAX; index++) {
    let startX = (MapSizeConfig.CLIENT_WIDTH_FIX * MapSizeConfig.tResScale) / 2 + index * 10 * MapSizeConfig.tResScale;
    let startY = (MapSizeConfig.CLIENT_HEIGHT_FIX * MapSizeConfig.tResScale) / 2 + index * 20 * MapSizeConfig.tResScale;
    let endX = startX + 100 * MapSizeConfig.tResScale;
    let endY = startY + 100 * MapSizeConfig.tResScale;
    reArr.push({
      startx: startX,
      starty: startY,
      endx: endX,
      endy: endY
    });
  }
  return reArr;
}

/*默认target 屏幕坐标*/
function defaultTarget() {
  let reArr = [];
  for (let index = 0; index < MapDef.RECT_MAX; index++) {
    let startX = (MapSizeConfig.CLIENT_WIDTH_FIX * MapSizeConfig.tResScale) / 2 + index * 10 * MapSizeConfig.tResScale;
    let startY = (MapSizeConfig.CLIENT_HEIGHT_FIX * MapSizeConfig.tResScale) / 2 + index * 20 * MapSizeConfig.tResScale;
    let endX = startX + TARGET_RECT_WIDTH;
    let endY = startY + TARGET_RECT_WIDTH;
    let x = (startX + endX) / 2;
    let y = (startY + endY) / 2;
    reArr.push({
      startx: startX,
      starty: startY,
      endx: endX,
      endy: endY,
      x,
      y
    });
  }
  return reArr;
}

export default {
  //解析虚拟墙数据
  parseVirtualWall(wallString) {
    let strVirtualWall = wallString;
    let m_virtualArray = [];
    if (strVirtualWall == '') {
      m_virtualArray = [];
    } else {
      if (strVirtualWall.indexOf('line') != -1) {
        strVirtualWall = strVirtualWall.substring(5, strVirtualWall.length);
        strVirtualWall = strVirtualWall.substring(0, strVirtualWall.length - 2);
      }
      let walls = strVirtualWall.split(' ');
      if (walls.length >= 4) {
        let wallArray = [];
        //代码疑点？？
        for (var i = 0; i < walls.length; ) {
          if (i > MapDef.VIRTUAL_WALL_MAX * 4 - 1) break;
          let wallLine = new MPVirtualWall(
            parseInt(walls[i++]),
            parseInt(walls[i++]),
            parseInt(walls[i++]),
            parseInt(walls[i++])
          );
          wallArray.push(wallLine);
        }
        m_virtualArray = wallArray;
      }
    }
    return m_virtualArray;
  },

  //解析禁区数据
  parseForbiddenZone(forbiddenString) {
    let strForbiddenString = forbiddenString;
    let m_ForbiddenArray = [];
    if (strForbiddenString == '') {
      m_ForbiddenArray = [];
    } else if (strForbiddenString.indexOf(MapDef.PROTOCAL_FORBIDDENZONE_KEY) != -1) {
      strForbiddenString = strForbiddenString.substring(12, strForbiddenString.length);
      strForbiddenString = strForbiddenString.substring(0, strForbiddenString.length - 2);
    }
    let forbiddens = strForbiddenString.split(MapDef.PROTOCAL_PARSE_STRING_KEY);
    if (forbiddens.length == 1) {
    } else {
      let forbiddenZoneArray = [];
      for (var i = 0; i < forbiddens.length; ) {
        if (i > 16) break;
        let forbidden = new MPForbiddenZone(
          parseInt(forbiddens[i++]),
          parseInt(forbiddens[i++]),
          parseInt(forbiddens[i++]),
          parseInt(forbiddens[i++])
        );

        forbiddenZoneArray.push(forbidden);
      }
      m_ForbiddenArray = forbiddenZoneArray;
    }
    return m_ForbiddenArray;
  },

  //解析禁区数据
  parseForbiddenZoneNew(forbiddenString) {
    if (!store.state.DeviceStatus.deviceStatus.robot_available.forbidenRotate) {
      //老协议 解析字符串
      let strForbiddenString = forbiddenString;
      let m_ForbiddenArray = [];
      if (strForbiddenString == '') {
        m_ForbiddenArray = [];
      } else if (strForbiddenString.indexOf(MapDef.PROTOCAL_FORBIDDENZONE_KEY) != -1) {
        strForbiddenString = strForbiddenString.substring(12, strForbiddenString.length);
        strForbiddenString = strForbiddenString.substring(0, strForbiddenString.length - 2);
      }
      let forbiddens = strForbiddenString.split(MapDef.PROTOCAL_PARSE_STRING_KEY);
      if (forbiddens.length == 1) {
      } else {
        let forbiddenZoneArray = [];
        for (var i = 0; i < forbiddens.length; ) {
          if (i > 16) break;
          let forbidden = new MPForbiddenZone(
            parseInt(forbiddens[i++]),
            parseInt(forbiddens[i++]),
            parseInt(forbiddens[i++]),
            parseInt(forbiddens[i++])
          );

          forbiddenZoneArray.push(forbidden);
        }
        m_ForbiddenArray = forbiddenZoneArray;
      }
      let result = (m_ForbiddenArray = m_ForbiddenArray.map(a => {
        return {
          p1: {
            x: a.left,
            y: a.top
          },
          p2: {
            x: a.right,
            y: a.top
          },
          p3: {
            x: a.right,
            y: a.bottom
          },
          p4: {
            x: a.left,
            y: a.bottom
          }
        };
      }));
      return result;
    } else {
      //新协议直接返回数值
      return forbiddenString;
    }
  },

  //判断是否触及虚拟墙
  isTouchVM(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      vm: undefined,
      index: -1,
      selected: false
    };
    let ctx = canvasMapRef.mapCtx();
    let walls = store.state.MapCacheStatus.mapStatus.virtualWall;
    let isSelected = false;
    for (let i = walls.length - 1; i >= 0; i--) {
      let wall = walls[i];

      if (isSelected) {
        wall.isEdit = false;
      } else {
        let vwDraw = new DrawVirtualWall(
          ctx,
          { x: wall.startX - translX, y: translY - wall.startY },
          { x: wall.endX - translX, y: translY - wall.endY },
          {},
          1,
          rate,
          canvasMapRef
        );
        if (vwDraw.isClickOpeation({ x: point.x, y: point.y })) {
          isSelected = true;
          touchRet.vm = wall;
          touchRet.selected = true;
          touchRet.index = i;
        }
      }
    }
    return touchRet;
  },

  //判断是否触及地图分割线
  isTouchSL(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      vm: undefined,
      index: -1,
      selected: false
    };
    let ctx = canvasMapRef.mapCtx();
    // 保存状态
    ctx.save();
    // 调整画布比例，方向
    canvasMapRef.prepare(ctx);
    let walls = store.state.MapCacheStatus.mapStatus.splitLine;
    let isSelected = false;
    for (let i = walls.length - 1; i >= 0; i--) {
      let wall = walls[i];

      if (isSelected) {
        wall.isEdit = false;
      } else {
        ctx.beginPath();
        // 返回角度
        function getSlideAngle(dx, dy) {
          return (Math.atan2(dy, dx) * 180) / Math.PI;
        }
        let X = wall.endX - wall.startX;
        let Y = wall.startY - wall.endY;
        let angle = getSlideAngle(X, Y);
        angle = (angle * 2 * Math.PI) / 360;
        let castV = (15 * MapSizeConfig.tResScale) / rate;
        let pos1 = { x: wall.startX - Math.sin(angle) * castV, y: wall.startY - Math.cos(angle) * castV };
        let pos2 = { x: wall.startX + Math.sin(angle) * castV, y: wall.startY + Math.cos(angle) * castV };
        let pos3 = { x: wall.endX + Math.sin(angle) * castV, y: wall.endY + Math.cos(angle) * castV };
        let pos4 = { x: wall.endX - Math.sin(angle) * castV, y: wall.endY - Math.cos(angle) * castV };
        ctx.moveTo(pos1.x - translX, translY - pos1.y);
        ctx.lineTo(pos2.x - translX, translY - pos2.y);
        ctx.lineTo(pos3.x - translX, translY - pos3.y);
        ctx.lineTo(pos4.x - translX, translY - pos4.y);
        ctx.lineTo(pos1.x - translX, translY - pos1.y);

        if (ctx.isPointInPath(point.x, point.y)) {
          isSelected = true;
          touchRet.vm = wall;
          touchRet.selected = true;
          touchRet.index = i;
        }
      }
    }
    ctx.restore();
    return touchRet;
  },

  //判断是否触及禁区
  isTouchForbidden(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      fd: undefined,
      index: -1,
      selected: false
    };
    let forbiddens = store.state.MapCacheStatus.mapStatus.forbidden;
    let isSelected = false;
    let ctx = canvasMapRef.mapCtx();
    for (let i = forbiddens.length - 1; i >= 0; i--) {
      let forbidden = forbiddens[i];
      let forb = new DrawForbiden(
        ctx,
        {
          x: forbidden.p1.x - translX,
          y: translY - forbidden.p1.y
        },
        {
          x: forbidden.p2.x - translX,
          y: translY - forbidden.p2.y
        },
        {
          x: forbidden.p3.x - translX,
          y: translY - forbidden.p3.y
        },
        {
          x: forbidden.p4.x - translX,
          y: translY - forbidden.p4.y
        },
        {
          operateWidth: 12
        },
        1,
        rate,
        canvasMapRef
      );
      let clickState = forb.isClickOpeation({ x: point.x, y: point.y });
      if (clickState == 'body' || clickState == 'easeP' || clickState == 'rotateP' || clickState == 'scaleP') {
        isSelected = true;
        touchRet.fd = forbidden;
        touchRet.selected = true;
        touchRet.index = i;
      }
    }
    return touchRet;
  },

  //判断是否触及禁区
  isTouchMopForbidden(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      fd: undefined,
      index: -1,
      selected: false
    };
    let forbiddens = store.state.MapCacheStatus.mapStatus.mopForbidden;
    let isSelected = false;
    let ctx = canvasMapRef.mapCtx();
    for (let i = forbiddens.length - 1; i >= 0; i--) {
      let forbidden = forbiddens[i];
      let forb = new DrawForbiden(
        ctx,
        {
          x: forbidden.p1.x - translX,
          y: translY - forbidden.p1.y
        },
        {
          x: forbidden.p2.x - translX,
          y: translY - forbidden.p2.y
        },
        {
          x: forbidden.p3.x - translX,
          y: translY - forbidden.p3.y
        },
        {
          x: forbidden.p4.x - translX,
          y: translY - forbidden.p4.y
        },
        {
          operateWidth: 12
        },
        1,
        rate,
        canvasMapRef
      );
      let clickState = forb.isClickOpeation({ x: point.x, y: point.y });
      if (clickState == 'body' || clickState == 'easeP' || clickState == 'rotateP' || clickState == 'scaleP') {
        isSelected = true;
        touchRet.fd = forbidden;
        touchRet.selected = true;
        touchRet.index = i;
      }
    }
    return touchRet;
  },

  //判断是否触及划区
  isTouchRect(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      fd: undefined,
      index: -1,
      selected: false
    };
    let rects = store.state.MapCacheStatus.mapStatus.drawRect;
    let isSelected = false;
    for (let i = rects.length - 1; i >= 0; i--) {
      let rect = rects[i];
      if (isSelected) {
        rect.isEdit = false;
      } else {
        let drawForbiden = new DrawForbiden(
          canvasMapRef.mapCtx(),
          {
            x: rect.left - translX,
            y: translY - rect.top
          },
          {
            x: rect.left - translX + rect.width,
            y: translY - rect.top
          },
          {
            x: rect.left - translX + rect.width,
            y: translY - rect.top + rect.height
          },
          {
            x: rect.left - translX,
            y: translY - rect.top + rect.height
          },
          {
            operateWidth: 12
          },
          1,
          rate,
          canvasMapRef
        );

        if (drawForbiden.isClickOpeation({ x: point.x, y: point.y })) {
          isSelected = true;
          touchRet.fd = rect;
          touchRet.selected = true;
          touchRet.index = i;
        }
      }
    }
    return touchRet;
  },
  //判断是否触及划区
  isTouchTarget(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      fd: undefined,
      index: -1,
      selected: false
    };
    let rects = store.state.MapCacheStatus.mapStatus.targetPosition;

    let isSelected = false;

    for (let i = rects.length - 1; i >= 0; i--) {
      let rect = rects[i];
      if (isSelected) {
        rect.isEdit = false;
      } else {
        let drawForbiden = new DrawForbiden(
          canvasMapRef.mapCtx(),
          {
            x: rect.left - translX,
            y: translY - rect.top
          },
          {
            x: rect.left - translX + rect.width,
            y: translY - rect.top
          },
          {
            x: rect.left - translX + rect.width,
            y: translY - rect.top + rect.height
          },
          {
            x: rect.left - translX,
            y: translY - rect.top + rect.height
          },
          {
            operateWidth: 12
          },
          1,
          rate,
          canvasMapRef
        );

        if (drawForbiden.isClickOpeation({ x: point.x, y: point.y })) {
          isSelected = true;
          touchRet.fd = rect;
          touchRet.selected = true;
          touchRet.index = i;
        }
      }
    }
    return touchRet;
  },

  //判断是否触及可编辑虚拟墙的编辑按钮
  vmFunction(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      selected: false, //是否点中了虚拟墙的功能按钮
      index: -1, //虚拟墙的索引
      functionType: 0 //点中了虚拟墙的关闭0或者编辑1
    };
    let ctx = canvasMapRef.mapCtx();
    let walls = store.state.MapCacheStatus.mapStatus.virtualWall;

    for (let i = walls.length - 1; i >= 0; i--) {
      let wall = walls[i];
      if (wall.isEdit) {
        let vwDraw = new DrawVirtualWall(
          ctx,
          { x: wall.startX - translX, y: translY - wall.startY },
          { x: wall.endX - translX, y: translY - wall.endY },
          { operateWidth: 12 },
          1,
          rate,
          canvasMapRef
        );
        let opetation = vwDraw.isClickOpeation({
          x: point.x,
          y: point.y
        });
        if (opetation == 'easeP') {
          touchRet = {
            selected: true, //是否点中了虚拟墙的功能按钮
            index: i, //虚拟墙的索引
            functionType: 0 //点中了虚拟墙的关闭0或者编辑1
          };
          break;
        }
        if (opetation == 'scaleP') {
          touchRet = {
            selected: true, //是否点中了虚拟墙的功能按钮
            index: i, //虚拟墙的索引
            functionType: 1 //点中了虚拟墙的关闭0或者编辑1
          };
          break;
        }
      }
    }
    return touchRet;
  },

  //判断是否触及地图分割的编辑按钮
  slFunction(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      selected: false, //是否点中了虚拟墙的功能按钮
      index: -1, //虚拟墙的索引
      functionType: 0 //点中了虚拟墙的关闭0或者编辑1
    };
    let ctx = canvasMapRef.mapCtx();
    // 保存状态
    ctx.save();
    // 调整画布比例，方向
    canvasMapRef.prepare(ctx);
    let walls = store.state.MapCacheStatus.mapStatus.splitLine;

    for (let i = walls.length - 1; i >= 0; i--) {
      let wall = walls[i];
      if (wall.isEdit) {
        ctx.beginPath();
        // 返回角度
        function getSlideAngle(dx, dy) {
          return (Math.atan2(dy, dx) * 180) / Math.PI;
        }
        let X = wall.endX - wall.startX;
        let Y = wall.startY - wall.endY;
        let angle = getSlideAngle(X, Y);
        angle = (angle * 2 * Math.PI) / 360;
        // let castV = 15 * MapSizeConfig.tResScale/rate;
        // let pos1 = {x:wall.startX - Math.sin(angle)*10,y:wall.startY - Math.cos(angle)*castV}
        // let pos2 = {x:wall.startX + Math.sin(angle)*10,y:wall.startY + Math.cos(angle)*castV}
        // let pos3 = {x:wall.endX + Math.sin(angle)*10,y:wall.endY + Math.cos(angle)*castV}
        // let pos4 = {x:wall.endX - Math.sin(angle)*10,y:wall.endY - Math.cos(angle)*castV}
        ctx.arc(wall.startX - translX, translY - wall.startY, (12 * MapSizeConfig.tResScale) / rate, 0, 2 * Math.PI);
        if (ctx.isPointInPath(point.x, point.y)) {
          touchRet = {
            selected: true, //是否点中了虚拟墙的功能按钮
            index: i, //虚拟墙的索引
            functionType: 0 //点中了虚拟墙的关闭0或者编辑1
          };
          break;
        }
        ctx.arc(wall.endX - translX, translY - wall.endY, (12 * MapSizeConfig.tResScale) / rate, 0, 2 * Math.PI);
        if (ctx.isPointInPath(point.x, point.y)) {
          touchRet = {
            selected: true, //是否点中了虚拟墙的功能按钮
            index: i, //虚拟墙的索引
            functionType: 1 //点中了虚拟墙的关闭0或者编辑1
          };
          break;
        }
      }
    }
    ctx.restore();
    return touchRet;
  },

  //判断是否触及可编辑禁区的编辑按钮
  fdFunction(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      selected: false, //是否点中了禁区的功能按钮
      index: -1, //禁区的索引
      functionType: 0 //点中了禁区的关闭0或者编辑1
    };
    let ctx = canvasMapRef.mapCtx();
    let forbiddens = store.state.MapCacheStatus.mapStatus.forbidden;
    for (let i = forbiddens.length - 1; i >= 0; i--) {
      let forbidden = forbiddens[i];
      if (forbidden.isEdit) {
        let forb = new DrawForbiden(
          ctx,
          {
            x: forbidden.p1.x - translX,
            y: translY - forbidden.p1.y
          },
          {
            x: forbidden.p2.x - translX,
            y: translY - forbidden.p2.y
          },
          {
            x: forbidden.p3.x - translX,
            y: translY - forbidden.p3.y
          },
          {
            x: forbidden.p4.x - translX,
            y: translY - forbidden.p4.y
          },
          {
            operateWidth: 12
          },
          1,
          rate,
          canvasMapRef
        );
        let clickState = forb.isClickOpeation({ x: point.x, y: point.y });
        if (clickState == 'body') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 1 //点中了禁区的关闭0或者编辑1  //拖动
          };
        }
        if (clickState == 'rotateP') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 2 //点中了禁区的关闭0或者编辑1
          };
        }
        if (clickState == 'scaleP') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 3 //点中了禁区的关闭0或者编辑1 //缩放
          };
        }
        if (clickState == 'easeP') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 0 //点中了禁区的关闭0或者编辑1 //缩放
          };
        }
      }
    }

    return touchRet;
  },

  //判断是否触及可编辑禁区的编辑按钮
  mopFdFunction(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      selected: false, //是否点中了禁区的功能按钮
      index: -1, //禁区的索引
      functionType: 0 //点中了禁区的关闭0或者编辑1
    };
    let ctx = canvasMapRef.mapCtx();
    let forbiddens = store.state.MapCacheStatus.mapStatus.mopForbidden;
    for (let i = forbiddens.length - 1; i >= 0; i--) {
      let forbidden = forbiddens[i];
      if (forbidden.isEdit) {
        let forb = new DrawForbiden(
          ctx,
          {
            x: forbidden.p1.x - translX,
            y: translY - forbidden.p1.y
          },
          {
            x: forbidden.p2.x - translX,
            y: translY - forbidden.p2.y
          },
          {
            x: forbidden.p3.x - translX,
            y: translY - forbidden.p3.y
          },
          {
            x: forbidden.p4.x - translX,
            y: translY - forbidden.p4.y
          },
          {
            operateWidth: 12
          },
          1,
          rate,
          canvasMapRef
        );
        let clickState = forb.isClickOpeation({ x: point.x, y: point.y });
        if (clickState == 'body') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 1 //点中了禁区的关闭0或者编辑1  //拖动
          };
        }
        if (clickState == 'rotateP') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 2 //点中了禁区的关闭0或者编辑1
          };
        }
        if (clickState == 'scaleP') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 3 //点中了禁区的关闭0或者编辑1 //缩放
          };
        }
        if (clickState == 'easeP') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 0 //点中了禁区的关闭0或者编辑1 //缩放
          };
        }
      }
    }

    return touchRet;
  },

  //判断是否触及可编辑划区的编辑按钮
  reFunction(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      selected: false, //是否点中了禁区的功能按钮
      index: -1, //禁区的索引
      functionType: 0 //点中了禁区的关闭0或者编辑1
    };
    let rects = store.state.MapCacheStatus.mapStatus.drawRect;
    for (let i = rects.length - 1; i >= 0; i--) {
      let rect = rects[i];
      if (rect.isEdit) {
        let drawForbiden = new DrawForbiden(
          canvasMapRef.mapCtx(),
          {
            x: rect.left - translX,
            y: translY - rect.top
          },
          {
            x: rect.left - translX + rect.width,
            y: translY - rect.top
          },
          {
            x: rect.left - translX + rect.width,
            y: translY - rect.top + rect.height
          },
          {
            x: rect.left - translX,
            y: translY - rect.top + rect.height
          },
          {
            operateWidth: 12
          },
          1,
          rate,
          canvasMapRef
        );
        let rst = drawForbiden.isClickOpeation({ x: point.x, y: point.y });
        if (rst == 'easeP') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 0 //点中了禁区的关闭
          };
        }
        if (rst == 'scaleP') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 1 //点中了禁区的编辑
          };
        }
        if (rst == 'body') {
          touchRet = {
            selected: false, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 2 //点中了禁区中间部位
          };
        }
      }
    }
    return touchRet;
  },
  //判断是否触及可编辑划区的编辑按钮
  TargetFunction(point, canvasMapRef, translX, translY, rate) {
    let touchRet = {
      selected: false, //是否点中了禁区的功能按钮
      index: -1, //禁区的索引
      functionType: 0 //点中了禁区的关闭0或者编辑1
    };
    let rects = store.state.MapCacheStatus.mapStatus.targetPosition;
    for (let i = rects.length - 1; i >= 0; i--) {
      let rect = rects[i];
      if (rect.isEdit) {
        let drawForbiden = new DrawForbiden(
          canvasMapRef.mapCtx(),
          {
            x: rect.left - translX,
            y: translY - rect.top
          },
          {
            x: rect.left - translX + rect.width,
            y: translY - rect.top
          },
          {
            x: rect.left - translX + rect.width,
            y: translY - rect.top + rect.height
          },
          {
            x: rect.left - translX,
            y: translY - rect.top + rect.height
          },
          {
            operateWidth: 12
          },
          1,
          rate,
          canvasMapRef
        );
        let rst = drawForbiden.isClickOpeation({ x: point.x, y: point.y });
        if (rst == 'easeP') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 0 //点中了禁区的关闭
          };
        }
        if (rst == 'scaleP') {
          touchRet = {
            selected: true, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 1 //点中了禁区的编辑
          };
        }
        if (rst == 'body') {
          touchRet = {
            selected: false, //是否点中了禁区的功能按钮
            index: i, //禁区的索引
            functionType: 2 //点中了禁区中间部位
          };
        }
      }
    }
    return touchRet;

    // if (rect.isEdit) {
    //   let clickState = drawForbiden.isClickOpeation({ x: point.x / rate, y: point.y / rate });
    //   if (clickState == 'body') {
    //     touchRet = {
    //       selected: true, //是否点中了禁区的功能按钮
    //       index: 0, //禁区的索引
    //       functionType: 1 //点中了禁区的关闭0或者编辑1  //拖动
    //     };
    //   }
    //   if (clickState == 'rotateP') {
    //     touchRet = {
    //       selected: true, //是否点中了禁区的功能按钮
    //       index: 0, //禁区的索引
    //       functionType: 2 //点中了禁区的关闭0或者编辑1
    //     };
    //   }
    //   if (clickState == 'scaleP') {
    //     touchRet = {
    //       selected: true, //是否点中了禁区的功能按钮
    //       index: 0, //禁区的索引
    //       functionType: 3 //点中了禁区的关闭0或者编辑1 //缩放
    //     };
    //   }
    //   if (clickState == 'easeP') {
    //     touchRet = {
    //       selected: true, //是否点中了禁区的功能按钮
    //       index: 0, //禁区的索引
    //       functionType: 0 //点中了禁区的关闭0或者编辑1 //缩放
    //     };
    //   }
    // }
  },

  //添加禁区
  addNewForbiddenTo(forbiddens, translX, translY, rate) {
    let defPos = defaultForbidden();
    let pos = defPos[0];
    for (let i = 0; i < defPos.length; i++) {
      let isEleValid = true;
      let tmp = defPos[i];
      let element = {
        startx: Math.floor(translX + tmp.startx / rate),
        starty: Math.floor(translY - tmp.starty / rate),
        endx: Math.floor(translX + tmp.endx / rate),
        endy: Math.floor(translY - tmp.endy / rate)
      };
      for (let j = 0; j < forbiddens.length; j++) {
        let forbidden = forbiddens[j];
        if (forbidden.left == element.startx && forbidden.top == element.starty) {
          isEleValid = false;
          break;
        }
      }
      if (isEleValid) {
        pos = element;
        break;
      }
    }
    let newForbidden = {
      isEdit: true,
      p1: {
        x: pos.startx,
        y: pos.starty
      },
      p2: {
        x: pos.endx,
        y: pos.starty
      },
      p3: {
        x: pos.endx,
        y: pos.endy
      },
      p4: {
        x: pos.startx,
        y: pos.endy
      }
    };
    return newForbidden;
  },

  //添加虚拟墙
  addNewVmTo(walls, translX, translY, rate) {
    let defPos = defaultWMPos();
    let pos = defPos[0];
    for (let i = 0; i < defPos.length; i++) {
      let isEleValid = true;
      let tmp = defPos[i];
      let element = {
        startx: Math.floor(translX + tmp.startx / rate),
        starty: Math.floor(translY - tmp.starty / rate),
        endx: Math.floor(translX + tmp.endx / rate),
        endy: Math.floor(translY - tmp.endy / rate)
      };
      for (let j = 0; j < walls.length; j++) {
        let wall = walls[j];
        if (wall.startX == element.startx) {
          isEleValid = false;
          break;
        }
      }
      if (isEleValid) {
        pos = element;
        break;
      }
    }
    let newWall = new MPVirtualWall(pos.startx, pos.starty, pos.endx, pos.endy);
    newWall.isEdit = true;
    return newWall;
  },

  //添加地图分割线
  addNewSplitLineTo(walls, translX, translY, rate) {
    let defPos = defaultSplitLine();
    let pos = defPos[0];
    for (let i = 0; i < defPos.length; i++) {
      let isEleValid = true;
      let tmp = defPos[i];
      let element = {
        startx: Math.floor(translX + tmp.startx / rate),
        starty: Math.floor(translY - tmp.starty / rate),
        endx: Math.floor(translX + tmp.endx / rate),
        endy: Math.floor(translY - tmp.endy / rate)
      };
      for (let j = 0; j < walls.length; j++) {
        let wall = walls[j];
        if (wall.startX == element.startx) {
          isEleValid = false;
          break;
        }
      }
      if (isEleValid) {
        pos = element;
        break;
      }
    }
    let newWall = new MPSplitLine(pos.startx, pos.starty, pos.endx, pos.endy);
    newWall.isEdit = true;
    return newWall;
  },

  //添加划区
  addNewRectTo(rects, translX, translY, rate) {
    let defPos = defaultRect();
    let pos = defPos[0];
    for (let i = 0; i < defPos.length; i++) {
      let isEleValid = true;
      let tmp = defPos[i];
      let element = {
        startx: Math.floor(translX + tmp.startx / rate),
        starty: Math.floor(translY - tmp.starty / rate),
        endx: Math.floor(translX + tmp.endx / rate),
        endy: Math.floor(translY - tmp.endy / rate)
      };
      for (let j = 0; j < rects.length; j++) {
        let rect = rects[j];
        if (rect.left == element.startx && rect.top == element.starty) {
          isEleValid = false;
          break;
        }
      }
      if (isEleValid) {
        pos = element;
        break;
      }
    }
    let newRect = new MPRectZone(pos.startx, pos.starty, pos.endx, pos.endy);
    newRect.isEdit = true;
    return newRect;
  },

  addNewTargetTo(rects, translX, translY, rate) {
    let defPos = defaultTarget();
    let pos = defPos[0];
    for (let i = 0; i < defPos.length; i++) {
      const tmp = defPos[i];
      const startx = Math.floor(translX + tmp.startx / rate);
      const starty = Math.floor(translY - tmp.starty / rate);
      let isEleValid = true;
      let element = {
        startx,
        starty,
        endx: startx + TARGET_RECT_WIDTH,
        endy: starty - TARGET_RECT_WIDTH,
        x: startx + TARGET_RECT_WIDTH / 2,
        y: starty - TARGET_RECT_WIDTH / 2
      };
      for (let j = 0; j < rects.length; j++) {
        let rect = rects[j];
        if (rect.left == element.startx && rect.top == element.starty) {
          isEleValid = false;
          break;
        }
      }
      if (isEleValid) {
        pos = element;
        break;
      }
    }
    let newRect = new MPTargetZone(pos.startx, pos.starty, pos.endx, pos.endy);
    newRect.isEdit = true;
    return newRect;
  },

  //判断扫地机与充电桩距离虚拟墙和禁区的距离
  checkWallIlegal: function (x, y, x1, y1, x2, y2, arround, rate) {
    if (x == 0 && y == 0) {
      return true;
    }
    var result = false;
    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;
    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) param = dot / len_sq;
    var xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    var dx = x - xx;
    var dy = y - yy;
    result = Math.sqrt(dx * dx + dy * dy) - arround > 0;
    return result;
  },

  checkForbiddenIlegal: function (x, y, x1, y1, x2, y2, arround, rate) {
    if (x == 0 && y == 0) {
      return true;
    }
    var paddingconst = arround;
    if (x > x1 - paddingconst && x < x2 + paddingconst && y < y1 + paddingconst && y > y2 - paddingconst) {
      return false;
    }
    return true;
  }
};
