import CommonToolUtils from '@/utils/tool/CommonToolUtils';
import { BasicToolOperation, IBasicToolOperationProps } from './basicToolOperation';
import DrawUtils from '../../utils/tool/DrawUtils';
import AxisUtils from '@/utils/tool/AxisUtils';
import uuid from '@/utils/uuid';
import {
  getBackPointsByCoord,
  getCuboidHoverRange,
  getCuboidSideLine,
  getHighlightPoints,
} from '@/utils/tool/CuboidUtils';
import PolygonUtils from '@/utils/tool/PolygonUtils';

interface ICuboidOperationProps extends IBasicToolOperationProps {}

enum EDrawingStatus {
  Ready = 1,
  FirstPoint = 2,
  Cuboid = 3,
}

class CuboidOperation extends BasicToolOperation {
  public drawingCuboid?: IDrawingCuboid;

  // First Click
  public firstClickCoord?: ICoordinate;

  public drawingStatus = EDrawingStatus.Ready;

  public cuboidList: ICuboid[] = [];

  public selectedID = '';

  public hoverID = '';

  public constructor(props: ICuboidOperationProps) {
    super(props);
    this.config = CommonToolUtils.jsonParser(props.config);
  }

  /**
   * 当前页面展示的框体
   */
  public get currentShowList() {
    let cuboidList: ICuboid[] = [];
    const [showingCuboid, selectedCuboid] = CommonToolUtils.getRenderResultList<ICuboid>(
      this.cuboidList,
      CommonToolUtils.getSourceID(this.basicResult),
      this.attributeLockList,
      this.selectedID,
    );
    cuboidList = showingCuboid;

    if (this.isHidden) {
      cuboidList = [];
    }

    if (selectedCuboid) {
      cuboidList.push(selectedCuboid);
    }
    return cuboidList;
  }

  public getHoverID = (e: MouseEvent) => {
    const coordinate = this.getCoordinateUnderZoom(e);

    const { currentShowList } = this;

    if (currentShowList?.length > 0) {
      // 1. Get the cuboid max range(PointList)
      const polygonList = currentShowList.map((cuboid) => {
        return { id: cuboid.id, pointList: AxisUtils.changePointListByZoom(getCuboidHoverRange(cuboid), this.zoom) };
      });
      return PolygonUtils.getHoverPolygonID(coordinate, polygonList);
    }

    return '';
  };

  public setResult() {}

  public onMouseUp(e: MouseEvent): boolean | void {
    super.onMouseUp(e);

    const basicSourceID = CommonToolUtils.getSourceID(this.basicResult);

    if (e.button === 0) {
      // 1. Create First Point & Basic Cuboid.
      if (!this.drawingCuboid) {
        this.createNewDrawingCuboid(e, basicSourceID);
        return;
      }

      // 2. Finish Rect
      if (this.drawingCuboid) {
        switch (this.drawingStatus) {
          case EDrawingStatus.FirstPoint:
            this.closeNewDrawingFrontPlane();
            break;
          case EDrawingStatus.Cuboid:
            this.closeCuboid();
            break;

          default: {
            //
          }
        }
      }
    }
  }

  public onMouseMove(e: MouseEvent): boolean | void {
    if (super.onMouseMove(e) || this.forbidMouseOperation || !this.imgInfo) {
      return;
    }

    if (this.drawingCuboid) {
      // 1. Drawing Front Plane.
      if (this.drawingFrontPlanesMove(e)) {
        return;
      }

      // 2. Drawing Back Plane.
      this.drawingBackPlaneMove(e);

      return;
    }

    this.hoverID = this.getHoverID(e);

    // Render HoverRender
    this.render();
  }

  public drawingFrontPlanesMove(e: MouseEvent) {
    if (this.drawingCuboid && this.firstClickCoord && this.drawingStatus === EDrawingStatus.FirstPoint) {
      const coord = this.getCoordinateInOrigin(e);
      const { x, y } = this.firstClickCoord;
      const width = Math.abs(coord.x - x);
      const height = Math.abs(coord.y - y);

      this.drawingCuboid = {
        ...this.drawingCuboid,
        frontPoints: {
          tl: this.firstClickCoord,
          tr: {
            x: x + width,
            y,
          },
          bl: {
            x,
            y: y + height,
          },
          br: {
            x: x + width,
            y: y + height,
          },
        },
      };
      this.render();
      return true;
    }
  }

  public drawingBackPlaneMove(e: MouseEvent) {
    if (this.drawingCuboid && this.firstClickCoord && this.drawingStatus === EDrawingStatus.Cuboid) {
      const coord = this.getCoordinateInOrigin(e);

      // Forbidden to draw a cuboid if the backPlane is front than the frontPlane.
      // if (coord.y > this.drawingCuboid.y + this.drawingCuboid.height) {
      //   return;
      // }
      this.drawingCuboid = {
        ...this.drawingCuboid,
        backPoints: getBackPointsByCoord({ coord, frontPoints: this.drawingCuboid.frontPoints }),
      };
      this.render();
    }
  }

  public createNewDrawingCuboid(e: MouseEvent, basicSourceID: string) {
    if (!this.imgInfo) {
      return;
    }
    // const coordinateZoom = this.getCoordinateUnderZoom(e);
    // const coordinate = AxisUtils.changeDrawOutsideTarget(
    //   coordinateZoom,
    //   { x: 0, y: 0 },
    //   this.imgInfo,
    //   this.config.drawOutsideTarget,
    //   this.basicResult,
    //   this.zoom,
    // );
    const coordinate = this.getCoordinateInOrigin(e);

    // 1. Create New Cuboid.
    this.drawingCuboid = {
      attribute: this.defaultAttribute,
      valid: !e.ctrlKey,
      id: uuid(8, 62),
      sourceID: basicSourceID,
      textAttribute: '',
      order: CommonToolUtils.getAllToolsMaxOrder(this.cuboidList, this.prevResultList) + 1,
      frontPoints: {
        tl: coordinate,
        bl: coordinate,
        tr: coordinate,
        br: coordinate,
      },
    };

    // 2. Save The First Click Coordinate.
    this.firstClickCoord = {
      ...coordinate,
    };

    // 3. Update Status.
    this.drawingStatus = EDrawingStatus.FirstPoint;
  }

  /**
   * Change Status
   * From drawing frontPlane to backPlane
   */
  public closeNewDrawingFrontPlane() {
    this.drawingStatus = EDrawingStatus.Cuboid;
  }

  public closeCuboid() {
    this.cuboidList.push(this.drawingCuboid as ICuboid);
    this.drawingCuboid = undefined;
    this.drawingStatus = EDrawingStatus.Ready;
    this.render();
  }

  public renderSingleCuboid(cuboid: ICuboid | IDrawingCuboid) {
    const transformCuboid = AxisUtils.changeCuboidByZoom(cuboid, this.zoom, this.currentPos);
    const toolColor = this.getColor(transformCuboid.attribute);
    const strokeColor = toolColor.valid.stroke;
    const lineWidth = this.style?.width ?? 2;
    const { hiddenText = false } = this.style;
    const defaultStyle = {
      color: strokeColor,
      thickness: lineWidth,
    };
    const { backPoints } = transformCuboid;
    if (backPoints) {
      const sideLine = getCuboidSideLine(transformCuboid as ICuboid);
      sideLine?.forEach((line) => {
        DrawUtils.drawLine(this.canvas, line.p1, line.p2, { ...defaultStyle });
      });

      // DrawUtils.drawRect(this.canvas, backRect, { ...defaultStyle });
      const backPointList = AxisUtils.transformPlain2PointList(backPoints);

      DrawUtils.drawPolygon(this.canvas, backPointList, { ...defaultStyle, isClose: true });

      // Hover Highlight
      if (transformCuboid.id === this.hoverID) {
        const hoverPointList = getHighlightPoints(transformCuboid as ICuboid);
        hoverPointList.forEach((point) => {
          DrawUtils.drawCircleWithFill(this.canvas, point, 5, { ...defaultStyle });
        });
      }
    }
    const pointList = AxisUtils.transformPlain2PointList(transformCuboid.frontPoints);
    DrawUtils.drawPolygonWithFill(this.canvas, pointList, { color: toolColor.valid.fill });
    DrawUtils.drawPolygon(this.canvas, pointList, { ...defaultStyle, isClose: true });

    let showText = '';
    if (this.isShowOrder && transformCuboid.order && transformCuboid?.order > 0) {
      showText = `${transformCuboid.order}`;
    }
    if (!hiddenText) {
      // DrawingText under the frontPlane.
      DrawUtils.drawText(
        this.canvas,
        { x: transformCuboid.frontPoints.tl.x, y: transformCuboid.frontPoints.tl.y - 5 },
        showText,
        {
          color: strokeColor,
          textMaxWidth: 300,
        },
      );
    }
  }

  public renderDrawing() {
    if (this.drawingCuboid) {
      this.renderSingleCuboid(this.drawingCuboid);
    }
  }

  public renderStatic() {
    this.cuboidList.forEach((box3d) => this.renderSingleCuboid(box3d));
  }

  public renderCuboid() {
    this.renderStatic();
    this.renderDrawing();
  }

  public render() {
    if (!this.ctx) {
      return;
    }
    super.render();
    this.renderCuboid();
    this.renderCursorLine();
  }
}

export default CuboidOperation;
