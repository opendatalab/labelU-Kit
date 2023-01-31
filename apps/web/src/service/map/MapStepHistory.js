export class MapStepHistory {
  constructor(size) {
    this.size = size;
    this.cache = [];
  }

  // 压栈，超过设定长度后，忽略最老的数据
  push(elment) {
    if (this.cache.length >= this.size) {
      this.cache.shift();
    }

    this.cache.push(elment);
  }

  // 删除最新的数据到指定的位置，包括指定的位置
  popTo(position) {
    let length = this.cache.length;
    let ret = null;
    if (length > position) {
      for (let i = length - 1; i >= position; i--) {
        ret = this.cache.pop();
      }
    }
    return ret;
  }

  clear() {
    this.cache.length = 0;
  }

  // 找到指定元素的位置，使用全等
  findCrossIndex(element) {
    const length = this.cache.length;

    // 寻找在线上相交的点
    for (let i = 0; i < length; i++) {
      const item = this.cache[i];
      if (element[0] == item[0] && element[1] == item[1] && element[2] == item[2]) {
        return i;
      }
    }

    // 寻找线段相交的点
    // 最少三个点的时候，才能出现线段相交的现象
    if (length > 3) {
      const start = this.cache[length - 1];

      function crossMul(v1, v2) {
        return v1[0] * v2[1] - v1[1] * v2[0];
      }

      function isPointTwoSide(centor, point, a0, a1) {
        const vp = [point[0] - centor[0], point[1] - centor[1]];
        const v0 = [a0[0] - centor[0], a0[1] - centor[1]];
        const v1 = [a1[0] - centor[0], a1[1] - centor[1]];

        // if(crossMul(vp, v0) * crossMul(vp, v1) == 0) {
        // }
        return crossMul(vp, v0) * crossMul(vp, v1) <= 0;
      }

      function isLineCross(startA, endA, startB, endB) {
        if (
          Math.max(startB[0], endB[0]) < Math.min(startA[0], endA[0]) ||
          Math.max(startA[0], endA[0]) < Math.min(startB[0], endB[0]) ||
          Math.max(startB[1], endB[1]) < Math.min(startA[1], endA[1]) ||
          Math.max(startA[1], endA[1]) < Math.min(startB[1], endB[1])
        ) {
          return false;
        }
        return isPointTwoSide(startA, endA, startB, endB) && isPointTwoSide(startB, endB, startA, endA);
      }

      for (let a = 0; a < length - 2; a++) {
        if (isLineCross(start, element, this.cache[a], this.cache[a + 1])) {
          return a;
        }
      }
    }

    return -1;
  }
}
