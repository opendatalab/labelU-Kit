export const TraceCutLine = {
  //阈值设定
  stepLimit: 3,

  //非画点类别
  EXCLUDE_POINT_TYPE: ['10', '20', '40', '90', '120', '130'],
  // 轨迹断线开关，待软件测修复后可关闭
  showUncuntedTrace: false,
  // 判断点后续非画点个数
  getUnLinePointCount: function (traceArray, index) {
    let count = 0;
    if (traceArray.length > 0) {
      for (let i = index; i < traceArray.length; i++) {
        if (this.EXCLUDE_POINT_TYPE.includes(traceArray[i][2])) {
          count++;
        } else {
          break;
        }
      }
    }
    return count;
  },
  // 断线处理，软件测类型问题，将stepLimit个点以内非划线点转为可划线点，将stepLimit个以上点删除多余点
  getdealedCutLine: function (traceArray) {
    if (this.showUncuntedTrace) {
      return traceArray;
    }
    let result = traceArray;
    //定位指针
    let p = 0;
    let setps = this.stepLimit;
    while (p < result.length) {
      let unDrawPointCount = this.getUnLinePointCount(traceArray, p);
      if (unDrawPointCount > setps) {
        result.splice(p + 1, unDrawPointCount - 2);
        p++;
      } else {
        if (this.EXCLUDE_POINT_TYPE.includes(result[p][2])) {
          //针对转换点类别标识为188
          result[p][2] = '188';
        }
      }
      p++;
    }
    return result;
  }
};
