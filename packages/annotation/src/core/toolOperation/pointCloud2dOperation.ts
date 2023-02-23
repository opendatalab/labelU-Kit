import { ESortDirection } from '@/constant/annotation';
import { edgeAdsorptionScope, EPolygonPattern } from '@/constant/tool';
import type { ToolConfig } from '@/interface/conbineTool';
import type { IPolygonData, IPolygonPoint } from '@/types/tool/polygon';
import MathUtils from '@/utils/MathUtils';
import AxisUtils from '@/utils/tool/AxisUtils';
import CommonToolUtils from '@/utils/tool/CommonToolUtils';
import DrawUtils from '@/utils/tool/DrawUtils';
import PolygonUtils from '@/utils/tool/PolygonUtils';
import StyleUtils from '@/utils/tool/StyleUtils';
import type { IPolygonOperationProps } from './polygonOperation';
import PolygonOperation from './polygonOperation';

interface IPointCloud2dOperationProps {
  showDirectionLine?: boolean;
  forbidAddNew?: boolean;
  isPointCloud2DTool?: boolean;
  config?: ToolConfig;
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

  public onMouseMove(event: MouseEvent) {
    event.preventDefault();
    super.onMouseMove(event);
    if (this.forbidMouseOperation || !this.imgInfo || !this.arrowPointList) {
      return;
    }
    const preisArrowHover = this.isArrowHover;
    const currentCoord = this.getCoordinateUnderZoom(event);
    const arrowPointlistByZoom = AxisUtils.changePointListByZoom(this.arrowPointList, this.zoom);
    const newIsArrowHoverIndex = AxisUtils.returnClosePointIndex(currentCoord, arrowPointlistByZoom);
    const isArrowHover = newIsArrowHoverIndex !== -1;

    if (preisArrowHover !== isArrowHover) {
      this.isArrowHover = newIsArrowHoverIndex !== -1;
      this.renderPolygon();
    }
    if ((this.isArrowHover && this.firstClickPoint) || this.rotatePointList) {
      this.getVirtualPolygon(event);
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

  /**
   * The color of attribute not change by attribute in 2d operation view
   * @param attribute
   * @returns
   */
  public getColor() {
    return super.getColor('');
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
    // if (e.ctrlKey && this.hoverID) {
    //   this.emit('addSelectedIDs', this.hoverID);
    // } else {
    //   this.emit('setSelectedIDs', this.hoverID);
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
      // this.emit('rotate',this.rotation)
      const newPolygon = {
        ...this.selectedPolygon,
        pointList: [...this.rotatePointList],
      };
      for (let i = 0; i < polygonList.length; i++) {
        if (polygonList[i].id === this.selectedID) {
          newPolygonList.push(newPolygon);
        } else {
          newPolygonList.push(polygonList[i]);
        }
      }
      this.polygonList = newPolygonList;
      this.emit('polygonCreated', newPolygon, this.zoom, this.currentPos);
      this.rotation = 0;
    }
  }

  public renderPolygon() {
    // 1. 静态多边形
    // this.container.dispatchEvent(this.saveDataEvent);
    // if (this.isHidden === false) {
    //   this.polygonList?.forEach((polygon) => {
    //     if ([this.selectedID, this.editPolygonID].includes(polygon.id)) {
    //       return;
    //     }
    //     if (polygon.isVisible) {
    //       const { textAttribute, attribute } = polygon;
    //       const toolColor = this.getColor(attribute);
    //       const toolData = StyleUtils.getStrokeAndFill(toolColor, polygon.valid);
    //       const transformPointList = AxisUtils.changePointListByZoom(
    //         polygon.pointList || [],
    //         this.zoom,
    //         this.currentPos,
    //       );

    //       DrawUtils.drawPolygonWithFillAndLine(this.canvas, transformPointList, {
    //         fillColor: toolData.fill,
    //         strokeColor: toolData.stroke,
    //         pointColor: 'white',
    //         thickness: this.style?.width ?? 2,
    //         lineCap: 'round',
    //         isClose: true,
    //         lineType: this.config?.lineType,
    //       });
    //     }
    //   });
    // }

    // 2. hover 多边形
    // if (this.hoverID && this.hoverID !== this.editPolygonID) {
    //   const hoverPolygon = this.polygonList.find((v) => v.id === this.hoverID && v.id !== this.selectedID);
    //   if (hoverPolygon) {
    //     let color = '';
    //     const toolColor = this.getColor(hoverPolygon.attribute);
    //     if (hoverPolygon.valid) {
    //       color = toolColor.validHover.fill;
    //     } else {
    //       color = StyleUtils.getStrokeAndFill(toolColor, false, { isHover: true }).fill;
    //     }

    //     DrawUtils.drawPolygonWithFill(
    //       this.canvas,
    //       AxisUtils.changePointListByZoom(hoverPolygon.pointList, this.zoom, this.currentPos),
    //       {
    //         color,
    //         lineType: this.config?.lineType,
    //       },
    //     );
    //   }
    // }

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
    }

    // 3. 选中多边形的渲染
    if (this.selectedID) {
      const selectdPolygon = this.selectedPolygon;
      if (selectdPolygon) {
        const toolColor = this.getColor();
        const toolData = StyleUtils.getStrokeAndFill(toolColor, selectdPolygon.valid, { isSelected: true });

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

        if (this.isShowArrow && selectdPolygon.isRect) {
          const sPoint = {
            x: (selectdPolygon.pointList[2].x + selectdPolygon.pointList[3].x) / 2,
            y: (selectdPolygon.pointList[2].y + selectdPolygon.pointList[3].y) / 2,
          };

          const vectorP = {
            x: (selectdPolygon.pointList[2].x - selectdPolygon.pointList[1].x) / 2,
            y: (selectdPolygon.pointList[2].y - selectdPolygon.pointList[1].y) / 2,
          };
          const sEnd = {
            x: sPoint.x + vectorP.x,
            y: sPoint.y + vectorP.y,
          };
          this.setArrowPointList([sPoint, sEnd]);
          const thickness = this.isArrowHover ? 10 : 3;
          DrawUtils.drawLineWithPointList(
            this.canvas,
            AxisUtils.changePointListByZoom([sPoint, sEnd], this.zoom, this.currentPos),
            {
              color: toolData.stroke,
              thickness,
              hoverEdgeIndex: this.hoverEdgeIndex,
              lineType: this.config?.lineType,
            },
          );
        }
      }
    }

    const defaultColor = this.getColor();
    const toolData = StyleUtils.getStrokeAndFill(defaultColor, !this.isCtrl);

    // 4. 编辑中的多边形
    if (this.drawingPointList?.length > 0) {
      // 渲染绘制中的多边形
      let drawingPointList = [...this.drawingPointList];
      let coordinate = AxisUtils.getOriginCoordinateWithOffsetCoordinate(this.coord, this.zoom, this.currentPos);

      if (this.pattern === EPolygonPattern.Rect && drawingPointList.length === 2) {
        // 矩形模式特殊绘制
        drawingPointList = MathUtils.getRectangleByRightAngle(coordinate, drawingPointList);
      } else {
        if (this.config?.edgeAdsorption && this.isAlt === false) {
          const { dropFoot } = PolygonUtils.getClosestPoint(
            coordinate,
            this.polygonList,
            this.config?.lineType,
            edgeAdsorptionScope / this.zoom,
          );
          if (dropFoot) {
            coordinate = dropFoot;
          }
        }
        drawingPointList.push(coordinate);
      }

      DrawUtils.drawSelectedPolygonWithFillAndLine(
        this.canvas,
        AxisUtils.changePointListByZoom(drawingPointList, this.zoom, this.currentPos),
        {
          fillColor: toolData.fill,
          strokeColor: toolData.stroke,
          pointColor: 'white',
          thickness: 2,
          lineCap: 'round',
          isClose: false,
          lineType: this.config.lineType,
        },
      );
    }

    // 5. 编辑中高亮的点
    if (this.hoverPointIndex > -1 && this.selectedID) {
      const selectdPolygon = this.selectedPolygon;
      if (!selectdPolygon) {
        return;
      }
      const hoverColor = StyleUtils.getStrokeAndFill(defaultColor, selectdPolygon.valid, { isSelected: true });

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
      const selectdPolygon = this.selectedPolygon;
      if (!selectdPolygon) {
        return;
      }
      const selectedColor = StyleUtils.getStrokeAndFill(defaultColor, selectdPolygon.valid, { isSelected: true });
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
      const toolColor = this.getColor();
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
