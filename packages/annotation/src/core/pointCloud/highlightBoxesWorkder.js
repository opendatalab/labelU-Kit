class PointCloudUtils {
  static genColorByCoord(x, y, z) {
    if (z <= 0) {
      return [128, 128, 128];
    }

    if (z < 5) {
      return [255, 0, 0];
    }

    if (z < 10) {
      return [0, 255, 0];
    }

    return [0, 0, 255];
  }

  static getStandardColorByCoord(x, y, z) {
    const pdColor = this.genColorByCoord(x, y, z);
    return pdColor.map((hex) => hex / 255);
  }
}

export function isInPolygon(checkPoint, polygonPoints, lineType = 0) {
  let counter = 0;
  let i;
  let xinters;
  let p1;
  let p2;

  polygonPoints = [...polygonPoints];
  if (lineType === 1) {
    polygonPoints = createSmoothCurvePoints(
      polygonPoints.reduce((acc, cur) => {
        return [...acc, cur.x, cur.y];
      }, []),
      0.5,
      true,
      SEGMENT_NUMBER,
    );
  }

  [p1] = polygonPoints;
  const pointCount = polygonPoints.length;

  for (i = 1; i <= pointCount; i++) {
    p2 = polygonPoints[i % pointCount];
    if (checkPoint.x > Math.min(p1.x, p2.x) && checkPoint.x <= Math.max(p1.x, p2.x)) {
      if (checkPoint.y <= Math.max(p1.y, p2.y)) {
        if (p1.x !== p2.x) {
          xinters = ((checkPoint.x - p1.x) * (p2.y - p1.y)) / (p2.x - p1.x) + p1.y;
          if (p1.y === p2.y || checkPoint.y <= xinters) {
            counter++;
          }
        }
      }
    }
    p1 = p2;
  }
  if (counter % 2 === 0) {
    return false;
  }
  return true;
}

onmessage = function onmessage(e) {
  const { rectList, position: points, color } = e.data;
  let num = 0;
  for (let i = 0; i < points.length; i += 3) {
    const x = points[i];
    const y = points[i + 1];
    const z = points[i + 2];
    for (let j = 0; j < rectList.length; j++) {
      const inPolygon = isInPolygon({ x, y }, rectList[j].rect);
      const [r, g, b] = rectList[j].inColorArr;
      if (inPolygon && z >= rectList[j].zInfo.minZ && z <= rectList[j].zInfo.maxZ) {
        num++;
        color[i] = r;
        color[i + 1] = g;
        color[i + 2] = b;
      }
    }
  }

  postMessage({ points, color, num });
};
