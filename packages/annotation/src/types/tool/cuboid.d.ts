enum ECuboidDirection {
  Front = 'front',
  Back = 'back',
  left = 'left',
  right = 'right',
  Top = 'top',
}

declare interface IPlanePoints {
  bl: ICoordinate; // Bottom Left Point;
  tl: ICoordinate; // Top Left Point;
  br: ICoordinate; // Bottom Right Point;
  tr: ICoordinate; // Top Right Point;
}

declare interface IBasicAnnotationInfo {
  // Basic
  id: string;
  sourceID: string;
  valid: boolean;
  attribute: string;
  textAttribute: string;
  order: number;
}

declare interface IDrawingCuboid extends IBasicAnnotationInfo {
  // Front Plane;
  frontPoints: IPlanePoints;

  // Back Plane;
  backPoints?: IPlanePoints;
}

declare interface ICuboid extends IBasicAnnotationInfo {
  // Direction of cuboid
  direction: ECuboidDirection;

  // Front Plane;
  frontPoints: IPlanePoints;

  // Back Plane;
  backPoints: IPlanePoints;
}
