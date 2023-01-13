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

export function getCuboidBasicInfo({ frontPoints, backPoints }: ICuboid) {
  const { width: frontWidth, height: frontHeight, centerPoints: frontCenter } = getPlanePointsBasicInfo(frontPoints);
  const { width: backWidth, height: backHeight, centerPoints: backCenter } = getPlanePointsBasicInfo(backPoints);
  return {
    frontCenter,
    backCenter,
    frontWidth,
    frontHeight,
    backWidth,
    backHeight,
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

/**
 * Just showing the points which can be adjusted
 * @param cuboid
 * @returns
 */
export function getHighlightPoints(cuboid: ICuboid) {
  const { backPoints } = cuboid;
  const { backCenter, frontCenter } = getCuboidBasicInfo(cuboid);

  const isLeftSide = backCenter.x < frontCenter.x;

  if (isLeftSide) {
    return [backPoints.tl, backPoints.bl, ...Object.values(cuboid.frontPoints)];
  }
  return [backPoints.tr, backPoints.br, ...Object.values(cuboid.frontPoints)];
}

/**
 * Notice. The order of points is disordered.
 * @param cuboid
 * @returns
 */
export function getHighLight(cuboid: ICuboid) {
  return [...Object.values(cuboid.frontPoints), ...Object.values(cuboid.backPoints)];
}

/**
 * Get the range of Cuboid in 2D.
 *
 *
 * @param param0
 * @returns
 */
export function getCuboidHoverRange(cuboid: ICuboid): ICoordinate[] {
  const { frontPoints, backPoints } = cuboid;
  const { backCenter, frontCenter, frontHeight, frontWidth, backHeight, backWidth } = getCuboidBasicInfo(cuboid);

  const diffWidth = Math.abs(frontWidth - backWidth);
  const diffHeight = Math.abs(frontHeight - backHeight);
  const diffCenterX = Math.abs(frontCenter.x - backCenter.x);
  const diffCenterY = Math.abs(frontCenter.y - backCenter.y);
  const isOverX = diffCenterX > diffWidth; // is BackPlane outside of the FrontPlane in X-Axis.
  const isOverY = diffCenterY > diffHeight; // is BackPlane outside of the FrontPlane in Y-Axis.

  const isNested = !(isOverX || isOverY);

  // 1. Is nested?
  if (isNested) {
    // Just front plane.
    return [frontPoints.tl, frontPoints.tr, frontPoints.br, frontPoints.bl];
  }

  /**
   * Default: FrontPoints is front to BackPoints.
   */

  // 2. leftSide - BackPlane is to the left of FrontPlane.
  const isLeftSide = backCenter.x < frontCenter.x;

  // 1. Just Y is Over.
  if (isOverY && !isOverX) {
    return [frontPoints.tl, backPoints.tl, backPoints.tr, frontPoints.tr, frontPoints.br, frontPoints.bl];
  }

  // 2. JustX is Over
  if (isOverX && !isOverY) {
    if (isLeftSide) {
      return [frontPoints.tl, frontPoints.tr, frontPoints.br, frontPoints.bl, backPoints.bl, backPoints.tl];
    }
    return [frontPoints.tl, frontPoints.tr, backPoints.tr, backPoints.br, frontPoints.br, frontPoints.bl];
  }

  // 3. Both over in X & Y Axis.
  if (isOverX && isOverY) {
    if (isLeftSide) {
      return [backPoints.tl, backPoints.tr, frontPoints.tr, frontPoints.br, frontPoints.bl, backPoints.bl];
    }

    return [frontPoints.tl, backPoints.tl, backPoints.tr, backPoints.br, frontPoints.br, frontPoints.bl];
  }

  return [];
}
