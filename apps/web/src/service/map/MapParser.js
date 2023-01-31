import { mapHelper } from './MapHelper';
import { MapStepHistory } from './MapStepHistory';
import { TraceCutLine } from './TraceCutLineDerail.js';

// 弓形区域直线开始
function isArchedAreaLineStartPoint(previous, current) {
  return current[2] == 70 && previous[2] != 70;
}
// 弓形区域直线结束
function isArchedAreaLineEndPoint(current, next) {
  return current[2] == 70 && next[2] != 70;
}

// 两个点是否相同
function isPointEqual(p1, p2) {
  if (p1 === p2) return true;

  return p1[0] === p2[0] && p1[1] === p2[1] && p1[2] == p2[2];
}

// 对除了指定的所有属性的轨迹使用相同的深度清除一次循环路径
// 深度不能太大，能优化掉大部分的循环路径
// '70'需要排除，因为存在直接掉头的问题
function removeAllPropertyCircleInTrace(trace, deep, properties) {
  const length = trace.length;
  const step = new MapStepHistory(deep);

  const ret = [];

  for (let i = 0; i < length; i++) {
    const current = trace[i];
    if (properties.indexOf(current[2]) < 0) {
      let index = step.findCrossIndex(current);
      if (index >= 0) {
        const popTo = step.popTo(index);
        for (let i = ret.length - 1; i >= 0; i--) {
          if (isPointEqual(ret.pop(), popTo)) {
            break;
          }
        }
      } else {
        step.push(current);
        ret.push(current);
      }
    } else {
      step.push(current);
      ret.push(current);
    }
  }

  return ret;
}

// 不同的属性使用不同的深度清除循环路径
// 区分不同的属性，以结合场景优化搜索深度。比如绕边（30）可以用更大的深度搜索，绕障（80）就需要用更小的深度，避免桌脚之类的被删掉
function removeCircleInTrace(trace, properties, deeps) {
  if (properties.length != deeps.length || properties.length == 0) {
    throw new Error('属性和搜索深度的大小应该匹配');
  }
  const length = trace.length;
  const steps = deeps.map(d => new MapStepHistory(d));

  function searchStepAndReset(property) {
    let i = properties.indexOf(property);

    for (const [idx, item] of steps.entries()) {
      if (idx != i) {
        item.clear();
      }
    }

    return i >= 0 ? steps[i] : null;
  }

  const ret = [];

  for (let i = 0; i < length; i++) {
    const current = trace[i];
    const step = searchStepAndReset(current[2]);
    if (step == null) {
      ret.push(current);
    } else {
      let index = step.findCrossIndex(current);
      if (index >= 0) {
        const popTo = step.popTo(index);
        for (let i = ret.length - 1; i >= 0; i--) {
          if (isPointEqual(ret.pop(), popTo)) {
            break;
          }
        }
      } else {
        step.push(current);
        ret.push(current);
      }
    }
  }

  return ret;
}

function beautifyArchedAreaLine(trace, modifyInterval, lineInterval) {
  const length = trace.length;

  const ret = [];

  let lineStartPoint = null;
  let lineEndPoint = null;

  const ignore = [];
  const ignoreSize = 5;

  let xLine = true;

  // 记录发现的所有X轴弓形直线信息，每个item的内容格式是[y, min-x, max-x]：
  // y - 直线所在的Y轴坐标
  // min-x, 直线开始的x轴坐标
  // max-x,直线结束的x轴坐标
  // 忽略了弓形直线的方向，仅考虑空间坐标位置
  const xArchedLines = [];

  // 记录发下的弓形直线
  function recordXLine(y, startX, endX) {
    const min = Math.min(startX, endX);
    const max = Math.max(startX, endX);

    let find = null;
    for (const line of xArchedLines) {
      if (line[0] == y && ((min >= line[1] && min <= line[2]) || (max <= line[2] && max >= line[1]))) {
        find = line;
        break;
      }
    }

    if (find == null) {
      xArchedLines.push([y, min, max]);
    } else {
      find[1] = Math.min(min, find[1]);
      find[2] = Math.max(max, find[2]);
    }
  }

  // 寻找已经记录的弓形直行，完全重叠是第一优先级，仅找距离间隔是1的直线
  function searchXLine(y, startX, endX) {
    const min = Math.min(startX, endX);
    const max = Math.max(startX, endX);

    let ret = null;
    for (const line of xArchedLines) {
      if (line[0] == y) {
        if ((min >= line[1] && min <= line[2]) || (max <= line[2] && max >= line[1])) {
          ret = line;
          break;
        }
      } else if (Math.abs(line[0] - y) <= 1) {
        if ((min >= line[1] && min <= line[2]) || (max <= line[2] && max >= line[1])) {
          ret = line;
        }
      }
    }

    return ret;
  }

  for (let i = length - 1; i >= 0; i--) {
    const current = trace[i];
    switch (current[2]) {
      case '60':
        // 正运行在弓形区域中，直接使用真实数据，其他忽略数据
        if (lineStartPoint == null && lineEndPoint == null) {
          ret.push(current);
        }
        break;
      case '70':
        ignore.length = 0;

        if (i == length - 1 || isArchedAreaLineEndPoint(current, trace[i + 1])) {
          xLine = current[0] != trace[i - 1][0];
          if (lineStartPoint != null) {
            if (xLine) {
              let fix = current;
              // 修正两条线之间的宽度
              if (modifyInterval && lineEndPoint != null) {
                let curHeight = current[1] - lineEndPoint[1];
                let absHeight = Math.abs(curHeight);
                if (absHeight < lineInterval) {
                  // 两条线之间太窄，拉宽
                  if (curHeight < 0) {
                    fix = [current[0], current[1] - (lineInterval - absHeight), current[2]];
                  } else {
                    fix = [current[0], current[1] + (lineInterval - absHeight), current[2]];
                  }
                } else if (absHeight > lineInterval && absHeight < 6) {
                  // 两条线之间太宽，过于宽超过6个像素（30cm）忽略
                  if (curHeight < 0) {
                    fix = [current[0], current[1] + (absHeight - lineInterval), current[2]];
                  } else {
                    fix = [current[0], current[1] - (absHeight - lineInterval), current[2]];
                  }
                }
              }
              // 修正X轴，同一个弓形区域的拐点上下对齐
              lineEndPoint = [lineStartPoint[0], fix[1], 'x-line'];
            } else {
              lineEndPoint = [current[0], lineStartPoint[1], 'y-line'];
            }
          } else {
            lineEndPoint = current;
          }
          ret.push(lineEndPoint);
          break;
        } else {
          if (i == 0 || isArchedAreaLineStartPoint(trace[i - 1], current)) {
            if (xLine) {
              const found = searchXLine(lineEndPoint[1], current[0], lineEndPoint[0]);
              if (found != null && found[0] != lineEndPoint[1]) {
                ret.pop();
                lineEndPoint[1] = found[0];
                ret.push(lineEndPoint);
              }

              lineStartPoint = [current[0], lineEndPoint[1], current[2]];

              if (lineEndPoint != null && isPointEqual(lineEndPoint, lineStartPoint)) {
                while (true) {
                  if (lineEndPoint == ret.pop()) {
                    break;
                  }
                }
              }

              recordXLine(lineEndPoint[1], lineStartPoint[0], lineEndPoint[0]);
            } else {
              lineStartPoint = [lineEndPoint[0], current[1], current[2]];
            }
            ret.push(lineStartPoint);
          } else {
            // 添加折返点
            if (xLine) {
              if ((current[0] - trace[i - 1][0]) * (current[0] - trace[i + 1][0]) >= 0) {
                ret.push([current[0], lineEndPoint[1], current[2]]);
              }
            } else {
              if ((current[1] - trace[i - 1][1]) * (current[1] - trace[i + 1][1]) >= 0) {
                ret.push([lineEndPoint[0], current[1], current[2]]);
              }
            }
          }
        }
        break;
      default:
        if (ignore.length < ignoreSize) {
          ignore.push(current);
        } else {
          ignore.forEach(element => {
            ret.push(element);
          });
          ignore.length = 0;

          // 当前状态说明已经退出了弓形区域，所有弓形区域相关的数据都要重置
          lineStartPoint = null;
          lineEndPoint = null;
        }
        break;
    }
  }

  return ret.reverse();
}

// 平滑除指定类型的的路径
// '70'路径因为经过了特殊不兼容处理，需要在平滑的时候忽略掉
function smoothTraceExclude(trace, properties) {
  const length = trace.length;
  if (length <= 3) {
    return trace;
  }

  const ret = [];
  ret.push(trace[0]);
  for (let i = 1; i < length - 1; i++) {
    if (properties.indexOf(trace[i][2]) < 0) {
      ret.push([
        (trace[i - 1][0] + trace[i][0] + trace[i + 1][0]) / 3,
        (trace[i - 1][1] + trace[i][1] + trace[i + 1][1]) / 3,
        trace[i][2]
      ]);
    } else {
      ret.push(trace[i]);
    }
  }
  ret.push(trace[length - 1]);

  return ret;
}

// 划线补充优化:将处于同一直线上的点精简为起点和终点
function deleteLinePoint(cleanWay) {
  //画线位置指针
  var p = 0;
  var cleanedLine = [];
  while (p < cleanWay.length) {
    cleanedLine.push(cleanWay[p]);
    var p2 = p + 1;
    var judge = null;
    //判断当前点 与下个点及下下个点是否在同一直线(x值相同 或者 Y值相同)，若是则跳过下个点
    for (p2; p2 < cleanWay.length - 1; p2++) {
      //若为X轴直线
      if (
        cleanWay[p][0] === cleanWay[p2][0] &&
        (judge === 'x' || judge === null) &&
        cleanWay[p][2] === cleanWay[p2][2]
      ) {
        if (cleanWay[p][0] === cleanWay[p2 + 1][0] && cleanWay[p][2] === cleanWay[p2 + 1][2]) {
          if (judge == null) {
            judge = 'x';
          }
          continue;
        } else {
          break;
        }
      } else if (
        cleanWay[p][1] === cleanWay[p2][1] &&
        (judge === 'y' || judge === null) &&
        cleanWay[p][2] === cleanWay[p2][2]
      ) {
        if (cleanWay[p][1] === cleanWay[p2 + 1][1] && cleanWay[p][2] === cleanWay[p2 + 1][2]) {
          if (judge == null) {
            judge = 'y';
          }
          continue;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    if (cleanWay[p2] !== undefined) cleanedLine.push(cleanWay[p2]);
    p = p2 + 1;
    judge = null;
  }
  return cleanedLine;
}

class MPParserBase {
  constructor() {
    // if(new.target === MPParserBase){
    //     throw new Error('抽象类不能实例化');
    // }
    // this.trace = [];
    // this.map = [];
  }
  parseMap(decodedMapData) {}
  parseTrace(decodedTraceData, mopType) {}
}

class M7Parser extends MPParserBase {
  constructor() {
    super();
  }
  parseMap(decodedMapData) {
    if (decodedMapData == undefined || decodedMapData.mapData == undefined || decodedMapData.rect == undefined) {
      return { rect: undefined, mapData: undefined };
    }
    var rect = decodedMapData.rect;
    var width = rect.right - rect.left + 1,
      height = rect.top - rect.bottom + 1;

    var i = 0;
    var datas = decodedMapData.mapData;
    //腐蚀去噪 11-26
    for (var h = height - 1; h >= 0; h--) {
      for (var p = h * width; p < (h + 1) * width; i++, p++) {
        if (
          (datas[i] & 0x02) > 0 &&
          (datas[i + 1] & 0x02) > 0 &&
          (datas[i + 2] & 0x02) > 0 &&
          (datas[i + 1] & 0x02) > 0
        ) {
          if ((datas[i - width] & 0x02) > 0) {
            datas[i - width] = 0;
          }
        } else if (
          (datas[i] & 0x02) > 0 &&
          (datas[i - 1] & 0x02) > 0 &&
          (datas[i + width] & 0x02) > 0 &&
          (datas[i + width * 2] & 0x02) > 0
        ) {
          if ((datas[i + 1] & 0x02) > 0 && (datas[i - 1] & 0x02) > 0) {
            datas[i + 1] = 0;
            datas[i - 1] = 0;
          }
        } else if (
          (datas[i] == 2 &&
            datas[i + 1] == 0 &&
            datas[i - 1] == 0 &&
            datas[i - width] == 0 &&
            i + width < datas.length &&
            datas[i + width] == 0) ||
          i + width > datas.length
        ) {
          datas[i] = 0;
        } else if (
          (datas[i] & datas[i + 1] & datas[i + 2] & datas[i + 3] & datas[i + 4] & datas[i + 5] & 0x02) != 0 &&
          (datas[width + i] & datas[i + width + 1] & datas[i + width + 2] & datas[i + width + 3] & 0x02) == 0
        ) {
          datas[width + i] = 0;
          datas[width + 1 + i] = 0;
          datas[width + 2 + i] = 0;
        }
      }
    }
    decodedMapData.mapData = datas;
    return decodedMapData;
  }
  parseTrace(decodedTraceData, mopType) {
    if (decodedTraceData == undefined || decodedTraceData.mapTraceArr == undefined) {
      return {
        traceArray: [], //原始轨迹
        traceFilteArray: [] //绘制轨迹时使用
      };
    }
    let trace = mapHelper.parseToTraceArray(decodedTraceData.mapTraceArr);
    if (trace.length > 0) {
      // 全属性移除绕圈路径
      trace = removeAllPropertyCircleInTrace.call(this, trace, 15, ['70']);
      //对沿边属性加强移除绕圈路径;
      trace = removeCircleInTrace.call(this, trace, ['30'], [40]);
      // 美化弓形区域0
      //trace = beautifyArchedAreaLine.call(this, trace, true, parseInt(mopType) % 2 == 0 ? 3 : 2);
      // 临时处理，断线处理，软件测类型问题，将3个点以内非划线点转为可划线点，将3个以上点删除多余点，可以在对象中设置阈值
      trace = TraceCutLine.getdealedCutLine(trace);

      // 将同一直线上点精简为起点和终点
      trace = deleteLinePoint(trace);
      // 平滑连接线
      trace = smoothTraceExclude.call(this, trace, ['70', 'x-line', 'y-line']);
    }
    return {
      traceArray: trace
    };
  }
}
export const MAP_TYPE = {
  MAP_TYPE_M7: 0,
  MAP_TYPE_OTHER: 1
};

let parserCreater = model => {
  if (MAP_TYPE.MAP_TYPE_M7 == model) {
    return new M7Parser();
  }
  //异常
  throw '禁止对未知的地图类型进行解析类的实例化';
};
export { parserCreater };
