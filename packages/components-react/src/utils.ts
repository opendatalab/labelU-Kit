import type { VideoAnnotationData, VideoFrameAnnotation, VideoSegmentAnnotation } from '@label-u/interface';

/**
 * Get the current operating system
 * @returns string
 */
export function getOS() {
  const userAgent = navigator.userAgent;
  let operatingSystem = 'Unknown';

  if (userAgent.indexOf('Win') !== -1) {
    operatingSystem = 'Windows';
  } else if (userAgent.indexOf('Mac') !== -1) {
    operatingSystem = 'MacOS';
  } else if (userAgent.indexOf('Linux') !== -1) {
    operatingSystem = 'Linux';
  } else if (userAgent.indexOf('Android') !== -1) {
    operatingSystem = 'Android';
  } else if (userAgent.indexOf('iOS') !== -1) {
    operatingSystem = 'iOS';
  }

  return operatingSystem;
}

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
export function scheduleAnnotationTrack(annotations: VideoAnnotationData[]) {
  const _annotations = annotations.slice();
  const inputs = _annotations.sort((a, b) => {
    if (a.type === 'segment' && b.type === 'frame') {
      return a.start - b.time;
    }

    if (a.type === 'frame' && b.type === 'segment') {
      return a.time - b.start;
    }

    if (a.type === 'frame' && b.type === 'frame') {
      return a.time - b.time;
    }

    if (a.type === 'segment' && b.type === 'segment') {
      return a.start - b.start;
    }

    return 0;
  });
  const segmentResult: VideoSegmentAnnotation[][] = [];
  const frameResult: VideoFrameAnnotation[][] = [];

  for (let i = 0; i < inputs.length; i += 1) {
    const curr = inputs[i];
    let processed = false;

    // 处理时间戳重合
    if (curr.type === 'frame') {
      for (let j = 0; j < frameResult.length; j += 1) {
        const lane = frameResult[j];
        const last = lane[lane.length - 1];

        if (curr.time! !== last.time!) {
          lane.push(curr);
          processed = true;
          break;
        }
      }

      if (!processed) {
        frameResult.push([curr]);
      }

      continue;
    }

    // 视频分割片断重合
    for (let j = 0; j < segmentResult.length; j += 1) {
      const lane = segmentResult[j];
      const last = lane[lane.length - 1];

      if (curr.start! > last.end!) {
        lane.push(curr);
        processed = true;
        break;
      }
    }

    if (!processed) {
      segmentResult.push([curr]);
    }
  }

  return [...segmentResult, ...frameResult];
}

type Func = (...args: any[]) => any; // 函数类型

/**
 * 节流函数
 * @param fn 节流函数
 * @param delay 延迟时间 s
 * @returns
 */
export function throttle(fn: Func, delay: number): Func {
  let timer: ReturnType<typeof setTimeout> | null;

  return function (this: ThisParameterType<Func>, ...args: any[]) {
    if (timer) {
      return;
    }

    timer = setTimeout(() => {
      fn.call(this, ...args);
      timer = null;
    }, delay);
  };
}
