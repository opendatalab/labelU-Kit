import { ESortDirection } from '@/constant/annotation';
import { EPolygonPattern } from '@/constant/tool';
import type { ToolConfig } from '@/interface/conbineTool';
import type { IPolygonData, IPolygonPoint } from '@/types/tool/polygon';
import MathUtils from '@/utils/MathUtils';
import AxisUtils from '@/utils/tool/AxisUtils';
import CommonToolUtils from '@/utils/tool/CommonToolUtils';
import DrawUtils from '@/utils/tool/DrawUtils';
import PolygonUtils from '@/utils/tool/PolygonUtils';
import StyleUtils from '@/utils/tool/StyleUtils';
import uuid from '@/utils/uuid';
import Vector from '@/utils/VectorUtils';
import { Vector2 } from 'three';
import { zoomInfo } from './basicToolOperation';
import type { IPolygonOperationProps } from './polygonOperation';
import PolygonOperation from './polygonOperation';

interface IPointCloud2dOperationProps {
  showDirectionLine?: boolean;
  forbidAddNew?: boolean;
  isPointCloud2DTool?: boolean;
  config?: ToolConfig;
  onMouseUp?: (e: MouseEvent) => undefined;
}

const POINT_CLOUD_POLYGON_PIXELRATIO = 1;

class PointCloud2dOperation extends PolygonOperation {
  public showDirectionLine: boolean;

  public forbidAddNew: boolean;

  private selectedIDs: string[] = [];

  public isPointCloud2DTool: boolean;

  public isShowArrow: boolean = false;

  public arrowPointList: IPolygonPoint[] | undefined;

  public isArrowHover: boolean = false;

  public firstClickPoint: IPolygonPoint | undefined;

  public rotatePointList: IPolygonPoint[] | undefined;

  public rotation: number = 0;

  constructor(props: IPolygonOperationProps & IPointCloud2dOperationProps) {
    super(props);
    this.isPointCloud2DTool = true;
    this.showDirectionLine = props.showDirectionLine ?? true;
    this.forbidAddNew = props.forbidAddNew ?? false;
  }

  public get pixelRatio() {
    return POINT_CLOUD_POLYGON_PIXELRATIO;
  }

  get getSelectedIDs() {
    return this.selectedIDs;
  }

  public setIsShowArrow(isShow: boolean = true) {
    this.isShowArrow = isShow;
  }

  /**
   * Update selectedIDs and rerender
   * @param selectedIDs
   */
  public setSelectedIDs(selectedIDs: string[]) {
    this.selectedIDs = selectedIDs;
    this.setSelectedID(this.selectedIDs.length === 1 ? this.selectedIDs[0] : '');
    this.render();
  }

  public deleteSelectedID() {
    super.deleteSelectedID();
    /** ID not existed and empty selectedID */
    this.selectedIDs = [];
    this.emit('deleteSelectedIDs');
  }

  public setArrowPointList(pointList: IPolygonPoint[]) {
    this.arrowPointList = pointList;
  }

  public onMouseUp(e: MouseEvent) {
    super.onMouseUp(e);
    this.setCustomCursor('none');
    this.rotatePointList = undefined;
    return undefined;
  }

  public setCursorWhenMove(event: MouseEvent) {
    // hover 框内
    if (this.getHoverID(event) && !this.rotatePointList && this.selectedPolygon) {
      console.log(this.hoverPointIndex);
      if (this.hoverPointIndex > -1) {
        let nexIndex = this.hoverPointIndex + 1;
        if (this.hoverPointIndex === 3) {
          nexIndex = 0;
        }
        let preIndex = this.hoverPointIndex - 1;
        if (this.hoverPointIndex === 0) {
          preIndex = 3;
        }
        const nextVetor = Vector.getVector(
          this.selectedPolygon.pointList[this.hoverPointIndex],
          this.selectedPolygon.pointList[nexIndex],
        );
        const prevVector = Vector.getVector(
          this.selectedPolygon.pointList[this.hoverPointIndex],
          this.selectedPolygon.pointList[preIndex],
        );
        const vetor = new Vector2(nextVetor.x + prevVector.x, nextVetor.y + prevVector.y);
        const angle = Math.abs((new Vector2(vetor.x, vetor.y).angle() / Math.PI) * 180);
        if ((angle > 270 && angle < 360) || (angle > 90 && angle < 180)) {
          this.setCustomCursor('ne-resize');
        } else {
          this.setCustomCursor('nw-resize');
        }
      } else if (this.hoverEdgeIndex === 0 || this.hoverEdgeIndex === 2) {
        this.setCustomCursor('e-resize');
      } else if (this.hoverEdgeIndex === 1 || this.hoverEdgeIndex === 3) {
        this.setCustomCursor('s-resize');
      } else if (event.buttons === 1) {
        this.setCustomCursor('grab');
      } else {
        this.setCustomCursor('pointer');
      }
    }
    // hover 箭头 或者 调整方向
    else if (this.isArrowHover || this.rotatePointList) {
      if (event.buttons === 1) {
        this.setCustomCursor('grab');
      } else {
        this.setCustomCursor('pointer');
      }
    } else {
      this.setCustomCursor('none');
    }
  }

  public onMouseMove(event: MouseEvent) {
    event.preventDefault();
    this.setCursorWhenMove(event);
    super.onMouseMove(event);
    if (this.forbidMouseOperation || !this.imgInfo || !this.arrowPointList) {
      return;
    }
    const currentCoord = this.getCoordinateUnderZoom(event);
    const currentCoordWithoutZoom = {
      x: currentCoord.x / this.zoom,
      y: currentCoord.y / this.zoom,
    };

    this.isArrowHover = AxisUtils.isPointInsect(
      currentCoordWithoutZoom,
      this.arrowPointList as [ICoordinate, ICoordinate],
    );

    if (this.isArrowHover) {
      this.renderPolygon();
    }
    if ((this.isArrowHover && this.firstClickPoint) || this.rotatePointList) {
      this.getVirtualPolygon(event);
    }

    if (this.isApproachBund(event) && this.isUncheckedApproachBoundary) {
      this.onMouseUp(event);
    }
  }

  public getVirtualPolygon(event: MouseEvent) {
    if (this.firstClickPoint) {
      const selectPolygonPoint = this.selectedPolygon?.pointList as IPolygonPoint[];

      const polygonCenterPoint = {
        x: (selectPolygonPoint[0].x + selectPolygonPoint[2].x) / 2,
        y: (selectPolygonPoint[0].y + selectPolygonPoint[2].y) / 2,
      };
      // 矩形中心点
      const centerPointUnderZoomAndPos = AxisUtils.changePointListByZoom(
        [polygonCenterPoint],
        this.zoom,
        this.currentPos,
      );

      const currentCoord = this.getCoordinate(event);

      const prevVector = {
        x: this.firstClickPoint.x - centerPointUnderZoomAndPos[0].x,
        y: this.firstClickPoint.y - centerPointUnderZoomAndPos[0].y,
      };

      const currentVector = {
        x: currentCoord.x - centerPointUnderZoomAndPos[0].x,
        y: currentCoord.y - centerPointUnderZoomAndPos[0].y,
      };
      const rotation = MathUtils.getAngle(prevVector, currentVector);
      // 旋转后的矩形
      this.rotatePointList = selectPolygonPoint.map((point) => {
        return AxisUtils.getRotatePoint(polygonCenterPoint, point, rotation);
      });
      this.rotation = rotation;
    }
  }

  public onMouseDown(e: MouseEvent) {
    if (super.onMouseDown(e) || this.forbidMouseOperation || e.ctrlKey === true) {
      return;
    }
    if (this.isArrowHover) {
      this.firstClickPoint = this.getCoordinate(e);
    }
    return true;
  }

  public onWheel(e: any, isRender = true): boolean | void {
    if (!this.imgNode || !this.coord) {
      return;
    }

    // 禁止外层滚轮操作
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY || e.wheelDelta;

    let operator: 0 | -1 | 1 = 0;

    if (delta > 0 && this.zoom > zoomInfo.min) {
      // 减小
      operator = -1;
    }
    if (delta < 0 && this.zoom < zoomInfo.max) {
      // 放大
      operator = 1;
    }
    this.wheelChangePos(this.getGetCenterCoordinate(), operator);
    if (isRender) {
      this.render();
    }
    this.renderBasicCanvas();
  }

  /**
   * Right click event
   * @override
   */
  // TODO: set rightmouse event for polygon
  public rightMouseUp = () => {
    // if (this.drawingPointList.length > 0) {
    //   this.addDrawingPointToPolygonList();
    //   return;
    // }
  };

  public get selectedPolygons() {
    return PolygonUtils.getPolygonByIDs(this.polygonList, this.selectedIDs);
  }

  /**
   * keydown event
   * @override
   */
  public onKeyDown = () => {};

  /**
   * keyup event
   * @override
   */
  public onKeyUp = () => {};

  public getLineColor() {
    return 'rgba(0, 255, 255, 0.5)';
  }

  /**
   * 初始化的添加的数据
   * @returns
   */
  public addDrawingPointToTopviewPolygonList(angle: number, isRect?: boolean, paramId?: string) {
    let { lowerLimitPointNum = 3 } = this.config;

    if (lowerLimitPointNum < 3) {
      lowerLimitPointNum = 3;
    }

    if (this.drawingPointList.length < lowerLimitPointNum) {
      // 小于下线点无法闭合, 直接清除数据
      this.drawingPointList = [];
      this.editPolygonID = '';

      return;
    }
    const basicSourceID = CommonToolUtils.getSourceID(this.basicResult);
    const polygonList = [...this.polygonList];

    const id = paramId || uuid(8, 62);
    let newPolygon: IPolygonData = {
      id,
      sourceID: basicSourceID,
      valid: !this.isCtrl,
      textAttribute: '',
      pointList: this.drawingPointList,
      attribute: this.defaultAttribute,
      order:
        CommonToolUtils.getMaxOrder(
          polygonList.filter((v) => CommonToolUtils.isSameSourceID(v.sourceID, basicSourceID)),
        ) + 1,
      isVisible: true,
      angle,
    };
    if (this.pattern === EPolygonPattern.Rect && isRect === true) {
      newPolygon = {
        ...newPolygon,
        isRect: true,
      };
    }

    polygonList.push(newPolygon);
    const createPolygon = newPolygon;

    this.setSelectedIdAfterAddingDrawing(id);
    this.setPolygonList(polygonList);

    this.isCtrl = false;
    this.drawingPointList = [];
    this.history.pushHistory(polygonList);

    if (createPolygon) {
      this.emit('polygonCreated', createPolygon, this.zoom, this.currentPos);
    }
  }

  /**
   * do no draw by this tool when left mouse click and move
   * @param e
   * @returns
   */
  public leftMouseUp() {
    this.firstClickPoint = undefined;
    if (this.rotatePointList && this.rotation && this.selectedPolygon) {
      const polygonList = [...this.polygonList];
      const newPolygonList = [];
      // Todo: rotate set for polygon
      // this.selectedPolygon?.pointList = this.rotatePointList
      const newPolygon = {
        ...this.selectedPolygon,
        angle: (this.rotation / Math.PI) * 180 + (this.selectedPolygon.angle as number),
      };
      for (let i = 0; i < polygonList.length; i++) {
        if (polygonList[i].id === this.selectedID) {
          newPolygonList.push(newPolygon);
        } else {
          newPolygonList.push(polygonList[i]);
        }
      }
      this.polygonList = newPolygonList;
      this.emit('polygonUpdate', newPolygon, this.zoom, this.currentPos);
      this.rotation = 0;
    }
  }

  public renderArrow(pointList: IPolygonPoint[], color: string) {
    const sPoint = {
      x: (pointList[2].x + pointList[3].x) / 2,
      y: (pointList[2].y + pointList[3].y) / 2,
    };

    const vectorP = {
      x: (pointList[2].x - pointList[1].x) / 5,
      y: (pointList[2].y - pointList[1].y) / 5,
    };
    const arrowEndPoint = {
      x: sPoint.x + vectorP.x * 1.3,
      y: sPoint.y + vectorP.y * 1.3,
    };
    const sEnd = {
      x: sPoint.x + vectorP.x,
      y: sPoint.y + vectorP.y,
    };

    const inputVector = new Vector2(sEnd.x - sPoint.x, sEnd.y - sPoint.y).multiplyScalar(0.4);

    const rotateVector = MathUtils.getRotateVector(inputVector, Math.PI * 0.5);
    if (rotateVector?.isVector3) {
      const rotatePoint = { x: sEnd.x + rotateVector.x, y: sEnd.y + rotateVector.y };
      const backRotatePoint = { x: sEnd.x - rotateVector.x, y: sEnd.y - rotateVector.y };
      const arrPointList = [sPoint, sEnd, rotatePoint, arrowEndPoint, backRotatePoint, sEnd];
      this.setArrowPointList(arrPointList);
      const thickness = 5;
      DrawUtils.drawPolygonWithFill(
        this.canvas,
        AxisUtils.changePointListByZoom(arrPointList, this.zoom, this.currentPos),
        {
          color,
          lineType: this.config?.lineType,
        },
      );

      DrawUtils.drawLineWithPointList(
        this.canvas,
        AxisUtils.changePointListByZoom(arrPointList, this.zoom, this.currentPos),
        {
          color,
          thickness,
          lineType: this.config?.lineType,
          lineCap: 'butt',
        },
      );
    }
  }

  public renderPolygon() {
    const selectdPolygon = this.selectedPolygon;
    if (!selectdPolygon) {
      return;
    }
    const toolColor = this.getColor(this.defaultAttribute);
    const toolData = StyleUtils.getStrokeAndFill(toolColor, selectdPolygon.valid, { isSelected: true });
    if (this.rotatePointList && this.rotation) {
      DrawUtils.drawSelectedPolygonWithFillAndLine(
        this.canvas,
        AxisUtils.changePointListByZoom(this.rotatePointList, this.zoom, this.currentPos),
        {
          // fillColor: toolData.fill,
          fillColor: 'transparent',
          strokeColor: 'red',
          pointColor: 'white',
          thickness: 2,
          lineCap: 'round',
          isClose: true,
          lineType: this.config?.lineType,
        },
      );
      this.renderArrow(this.rotatePointList, 'red');
    }

    // 3. 选中多边形的渲染
    if (this.selectedID) {
      if (selectdPolygon) {
        DrawUtils.drawSelectedPolygonWithFillAndLine(
          this.canvas,
          AxisUtils.changePointListByZoom(selectdPolygon.pointList, this.zoom, this.currentPos),
          {
            // fillColor: toolData.fill,
            fillColor: 'transparent',
            strokeColor: toolData.stroke,
            pointColor: 'white',
            thickness: 2,
            lineCap: 'round',
            isClose: true,
            lineType: this.config?.lineType,
          },
        );
      }
    }

    // 5. 编辑中高亮的点
    if (this.hoverPointIndex > -1 && this.selectedID) {
      const hoverColor = StyleUtils.getStrokeAndFill(toolColor, selectdPolygon.valid, { isSelected: true });

      const point = selectdPolygon?.pointList[this.hoverPointIndex];
      if (point) {
        const { x, y } = AxisUtils.changePointByZoom(point, this.zoom, this.currentPos);
        DrawUtils.drawCircleWithFill(this.canvas, { x, y }, 5, {
          color: hoverColor.fill,
        });
      }
    }

    // 6. 编辑中高亮的边
    if (this.hoverEdgeIndex > -1 && this.selectedID) {
      const selectedColor = StyleUtils.getStrokeAndFill(toolColor, selectdPolygon.valid, { isSelected: true });
      DrawUtils.drawLineWithPointList(
        this.canvas,
        AxisUtils.changePointListByZoom(selectdPolygon.pointList, this.zoom, this.currentPos),
        {
          color: selectedColor.stroke,
          thickness: 10,
          hoverEdgeIndex: this.hoverEdgeIndex,
          lineType: this.config?.lineType,
        },
      );
    }
    // 绘制 箭头
    if (this.isShowArrow && selectdPolygon.isRect) {
      this.renderArrow(selectdPolygon.pointList, toolData.stroke);
    }
  }

  /**
   * Update the show
   * @override
   * */
  public renderSelectedPolygon() {
    this.selectedPolygons?.forEach((polygon) => {
      this.renderSingleSelectedPolygon(polygon);
    });
  }

  public renderSingleSelectedPolygon = (selectedPolygon: IPolygonData) => {
    if (this.selectedPolygons) {
      const toolColor = this.getColor(this.defaultAttribute);
      const toolData = StyleUtils.getStrokeAndFill(toolColor, selectedPolygon.valid, { isSelected: true });

      const polygon = AxisUtils.changePointListByZoom(selectedPolygon.pointList, this.zoom, this.currentPos);

      DrawUtils.drawSelectedPolygonWithFillAndLine(this.canvas, polygon, {
        fillColor: 'transparent',
        strokeColor: toolData.stroke,
        pointColor: 'white',
        thickness: 2,
        lineCap: 'round',
        isClose: true,
        lineType: this.config?.lineType,
      });

      // Only the rectangle shows the direction.
      if (selectedPolygon.isRect === true && this.showDirectionLine === true) {
        this.renderRectPolygonDirection(polygon);
      }
    }
  };

  public renderRectPolygonDirection(polygon: IPolygonPoint[]) {
    if (polygon.length < 2) {
      return;
    }

    DrawUtils.drawLine(this.canvas, polygon[0], polygon[1], {
      color: 'red',
      thickness: 3,
    });
  }

  public get currentPolygonListByPattern() {
    return this.polygonList.filter((v) => {
      if (this.pattern === EPolygonPattern.Rect) {
        return v.isRect === true;
      }

      if (this.pattern === EPolygonPattern.Normal) {
        return v.isRect !== true;
      }

      return true;
    });
  }

  /**
   * Filter the polygon by Pattern
   * @override
   * */
  public getHoverID(e: MouseEvent) {
    const coordinate = this.getCoordinateUnderZoom(e);

    // Key Point!
    const currentPolygonList = this.currentPolygonListByPattern;

    const polygonListWithZoom = currentPolygonList.map((polygon) => ({
      ...polygon,
      pointList: AxisUtils.changePointListByZoom(polygon.pointList, this.zoom),
    }));
    return PolygonUtils.getHoverPolygonID(coordinate, polygonListWithZoom, 10, this.config?.lineType);
  }

  /**
   * Filter the polygon by Pattern
   * @override
   * */
  public switchToNextPolygon(sort: ESortDirection = ESortDirection.ascend) {
    // If it is in drawing, return;
    if (this.drawingPointList.length > 0) {
      return;
    }

    // Compared to the original filtering of patterns
    const sortList = this.currentPolygonListByPattern.map((v) => ({
      ...v,
      x: v.pointList[0]?.x ?? 0, // Sort with the first point.
      y: v.pointList[0]?.y ?? 0,
    }));

    const nextSelectedResult = CommonToolUtils.getNextSelectedRectID(sortList, sort, this.selectedID);
    if (nextSelectedResult) {
      this.setSelectedIDs([nextSelectedResult.id]);
      this.render();
      return [nextSelectedResult.id];
    }
  }

  /**
   * Be selected after created.
   * @override
   */
  public setSelectedIdAfterAddingDrawing(newID: string) {
    if (this.drawingPointList.length === 0) {
      return;
    }

    this.setSelectedID(newID);
  }

  /**
   * Overwrite and prevent selectedChange emit
   * @override
   */
  public setSelectedID(newID?: string) {
    // const oldID = this.selectedID;
    // if (newID !== oldID && oldID) {
    //   // 触发文本切换的操作

    //   this._textAttributInstance?.changeSelected();
    // }
    // if (!newID) {
    //   this._textAttributInstance?.clearTextAttribute();
    // }

    this.selectedID = newID;
    this.render();
  }

  public addPointInDrawing(e: MouseEvent) {
    if (this.forbidAddNew) {
      return;
    }
    super.addPointInDrawing(e);
  }

  /**
   * Update canvas size directly
   * @param size
   */
  public setCanvasSize(size: ISize) {
    const pixel = this.pixelRatio;

    // Init Data
    this.size = size;
    // this.setImgInfo(size);

    // Update canvas size.
    // this.updateCanvasBasicStyle(this.basicCanvas, size, 0);
    // this.updateCanvasBasicStyle(this.canvas, size, 10);
    this.ctx?.scale(pixel, pixel);
    this.basicCtx?.scale(pixel, pixel);

    // Restore to the initialization position
    this.initImgPos();

    // Render
    this.renderBasicCanvas();
    this.render();
  }

  /**
   * If the operation is triggered internally, it will emit validUpdate.
   *
   * The Invalid update needs to be added a params.
   * @override
   * @param id
   * @param forbidEmit
   * @returns
   */
  public setPolygonValidAndRender(id: string, isUpdate = false) {
    if (isUpdate) {
      super.setPolygonValidAndRender(id);
      return;
    }
    this.emit('validUpdate', id);
  }
}

export default PointCloud2dOperation;

export { IPointCloud2dOperationProps };
