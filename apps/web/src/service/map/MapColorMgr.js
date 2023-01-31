function ColorManager(nmask, colors, blend) {
  this.needmask = nmask;
  this.colorMap = [];
  this.blend = !!blend;
  for (var i = 0, color; i < colors.length; i++) (color = colors[i]), (this.colorMap[color[0]] = color[1]);

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
}
export var mapColorMgr = {
  // 未填充区域颜色
  unbindColorManager: function () {
    return new ColorManager(0xf8, [[0xf8, [142, 108, 255, 0]]]);
  },
  // 清扫区域点阵-颜色对应表
  baseColorManager: function () {
    return new ColorManager(0x03, [
      [0x00, [127, 127, 127, 0]], //未探索 灰色
      [0x01, [207, 223, 249, 255]], //已探索 蓝色
      [0x02, [93, 117, 246, 255]], //机身覆盖区 绿色
      [0x03, [255, 255, 255, 77]], //已清扫区 白色
      [0x04, [38, 122, 255, 255]], //障碍物点 灰黑色
      [0x05, [171, 65, 171, 255]], //碰撞点 紫色
      [0x06, [255, 55, 0, 0]], //手绘虚拟墙点
      [0x07, [93, 117, 246, 255]], //保留
      [0x08, [93, 117, 246, 255]], //保留
      [0x09, [255, 255, 255, 255]] //轨迹点
    ]);
  },
  // 清扫轨迹颜色
  routeColorManager: function () {
    return new ColorManager(0x03, [[0x02, [20, 20, 200, 255]]]);
  },
  // 区域颜色 最多支持15个
  areaUnselectColorManager: function () {
    return new ColorManager(
      [10, 0, 255, 100],
      [
        [0x10, [194, 230, 177, 255]],
        [0x20, [135, 232, 222, 255]],
        [0x30, [153, 193, 245, 255]],
        [0x40, [244, 207, 137, 255]],
        [0x50, [145, 213, 255, 255]],
        [0x60, [170, 167, 247, 255]],
        [0x70, [194, 230, 177, 255]],
        [0x80, [135, 232, 222, 255]],
        [0x90, [153, 193, 245, 255]],
        [0xa0, [244, 207, 137, 255]],
        [0xb0, [145, 213, 255, 255]],
        [0xc0, [170, 167, 247, 255]],
        [0xd0, [194, 230, 177, 255]],
        [0xe0, [135, 232, 222, 255]],
        [0xf0, [153, 193, 245, 255]],
        [0x63, [102, 110, 116, 255]],
        [0x64, [207, 207, 207, 255]]
      ],
      false
    );
  },

  // 区域颜色 最多支持15个
  areaColorManager: function () {
    return new ColorManager(
      [10, 0, 255, 100],
      [
        [0x10, [112, 190, 84, 255]],
        [0x20, [19, 194, 194, 255]],
        [0x30, [98, 153, 226, 255]],
        [0x40, [221, 149, 13, 255]],
        [0x50, [24, 144, 255, 255]],
        [0x60, [146, 84, 222, 255]],
        [0x70, [112, 190, 84, 255]],
        [0x80, [19, 194, 194, 255]],
        [0x90, [98, 153, 226, 255]],
        [0xa0, [221, 149, 13, 255]],
        [0xb0, [24, 144, 255, 255]],
        [0xc0, [146, 84, 222, 255]],
        [0xd0, [112, 190, 84, 255]],
        [0xe0, [19, 194, 194, 255]],
        [0xf0, [98, 153, 226, 255]],
        [0x63, [102, 110, 116, 255]]
      ],
      false
    );
  }
};
