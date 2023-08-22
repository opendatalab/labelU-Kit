import type { VideoAnnotation } from './AnnotationBar';

/**
 * 把毫秒转换成时长
 * 1.若小于等于60秒,显示秒数
 * 2.若大于1分钟小于1小时,显示分钟
 * 3.若大于1小时,显示x小时x分钟
 * @param s 秒数
 * @returns string
 */
export function secondsToMinute(s: number) {
  let sTime = Math.floor(s); // 秒
  let mTime = 0; // 分
  let hTime = 0; // 时
  if (sTime > 60) {
    //如果秒数大于60，将秒数转换成整数
    //获取分钟，除以60取整数，得到整数分钟
    mTime = Math.floor(sTime / 60);
    //获取秒数，秒数取佘，得到整数秒数
    sTime = Math.floor(sTime % 60);
    //如果分钟大于60，将分钟转换成小时
    if (mTime > 60) {
      //获取小时，获取分钟除以60，得到整数小时
      hTime = Math.floor(mTime / 60);
      //获取小时后取佘的分，获取分钟除以60取佘的分
      mTime = Math.floor(mTime % 60);
    }
  }
  let result = '';
  if (sTime >= 0 && sTime < 10) {
    result = '0' + Math.floor(sTime) + '';
  } else {
    result = '' + Math.floor(sTime) + '';
  }
  if (mTime >= 0 && mTime < 10) {
    result = '0' + Math.floor(mTime) + ':' + result;
  } else {
    result = '' + Math.floor(mTime) + ':' + result;
  }
  if (hTime >= 0 && hTime < 10) {
    result = '0' + Math.floor(hTime) + ':' + result;
  } else {
    result = '' + Math.floor(hTime) + ':' + result;
  }
  return result;
}

/**
 * 生成随机字符串
 * @returns string
 */
export function uid() {
  return Math.random().toString(36).slice(2);
}

/**
 * 解析时间为一位小数
 * @param _input number
 * @returns
 */
export function parseTime(_input: number) {
  let input = _input;
  if (typeof input === 'string' && !isNaN(+input)) {
    input = +input;
  }

  if (typeof input !== 'number') {
    throw Error('input should be a number');
  }

  return parseFloat(input.toFixed(1));
}

/**
 * 将重合的视频标注分配到不同的轨道
 * @param annotations
 * @returns
 */
export function scheduleVideoAnnotationLane(annotations: VideoAnnotation[]) {
  const inputs = annotations.sort((a, b) => (a.start || a.time)! - b.start!);
  const result: VideoAnnotation[][] = [[inputs[0]]];

  for (let i = 1; i < inputs.length; i += 1) {
    const curr = inputs[i];
    let inserted = false;

    for (let j = 0; j < result.length; j += 1) {
      const lane = result[j];
      const last = lane[lane.length - 1];

      if (curr.type === 'segment' && curr.start! > last.end!) {
        lane.push(curr);
        inserted = true;
        break;
      }

      if (curr.type === 'frame' && curr.time! > last.time!) {
        lane.push(curr);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      result.push([curr]);
    }
  }

  return result;
}
