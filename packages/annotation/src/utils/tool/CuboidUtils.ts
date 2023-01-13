/**
 * Get the basicInfo of cuboid-frontPoints.
 * @param param0
 * @returns
 */
export function getPlanePointsBasicInfo({ tr, tl, br }: IPlanePoints) {
  return {
    width: Math.abs(tr.x - tl.x),
    height: Math.abs(br.y - tr.y),
    centerPoints: {
      x: (tl.x + br.x) / 2,
      y: (tl.y + br.y) / 2,
    },
  };
}

/**
 * Know the frontPoints and coord to get the backPoints
 * @param param0
 * @returns
 */
export function getBackPointsByCoord({
  coord,
  frontPoints,
}: {
  coord: ICoordinate;
  frontPoints: IPlanePoints;
}): IPlanePoints {
  const { width, height } = getPlanePointsBasicInfo(frontPoints);

  // Right Side
  return {
    br: coord,
    tr: {
      x: coord.x,
      y: coord.y - height,
    },
    tl: {
      x: coord.x - width,
      y: coord.y - height,
    },
    bl: {
      x: coord.x - width,
      y: coord.y,
    },
  };
}

/**
 * Get SideLine By FrontPoints & BackPoints
 * @param param0
 * @returns
 */
export function getCuboidSideLine({ frontPoints, backPoints }: ICuboid) {
  return [
    {
      p1: frontPoints.bl,
      p2: backPoints.bl,
    },
    {
      p1: frontPoints.tl,
      p2: backPoints.tl,
    },
    {
      p1: frontPoints.tr,
      p2: backPoints.tr,
    },
    {
      p1: frontPoints.br,
      p2: backPoints.br,
    },
  ];
}

export function getHighLightSidePoints({ backPoints, frontPoints }: ICuboid) {
  const { centerPoints: frontCenter } = getPlanePointsBasicInfo(frontPoints);
  const { centerPoints: backCenter } = getPlanePointsBasicInfo(backPoints);

  const isLeftSide = backCenter.x < frontCenter.x;

  if (isLeftSide) {
    return [backPoints.tl, backPoints.bl];
  }
  return [backPoints.tr, backPoints.br];
}
