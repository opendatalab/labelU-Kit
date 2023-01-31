import {
  PointCloudAnnotation,
  PointCloud,
  PointCloudOperation,
  MathUtils,
} from '@label-u/annotation';
import {
  IPointCloudBox,
  EPerspectiveView,
  PointCloudUtils,
  IPolygonPoint,
  IPolygonData,
} from '@label-u/utils';
import { useContext } from 'react';
import { PointCloudContext } from '../PointCloudContext';
import { useSingleBox } from './useSingleBox';
import { ISize } from '@/types/main';
import _ from 'lodash';
import { useDispatch, useSelector } from '@/store/ctx';
import { AppState } from '@/store';
import StepUtils from '@/utils/StepUtils';
import { jsonParser } from '@/utils';
import { SetPointCloudLoading } from '@/store/annotation/actionCreators';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

const DEFAULT_SCOPE = 5;
const DEFAULT_RADIUS = 90;

export const PointCloudView = {
  '3D': '3D',
  Top: 'Top',
  Side: 'Side',
  Back: 'Back',
};

export const topViewPolygon2PointCloud = (
  newPolygon: any,
  size: ISize,
  pointCloud?: PointCloud,
  selectedPointCloudBox?: IPointCloudBox,
  defaultValue?: { [v: string]: any },
) => {
  if (!pointCloud) {
    return;
  }
  const [point1, point2, point3, point4] = newPolygon.pointList.map((v: any) =>
    MathUtils.transferCanvas2World(v, size),
  );

  const centerPoint = MathUtils.getLineCenterPoint([point1, point3]);
  const height = MathUtils.getLineLength(point1, point2);
  const width = MathUtils.getLineLength(point2, point3);
  const rotation = MathUtils.getRadiusFromQuadrangle(newPolygon.pointList);
  let z = 0;
  let depth = 1;
  let extraData = {};

  // Init PointCloud Data
  // if (pointCloud) {
  const zInfo = pointCloud.getSensesPointZAxisInPolygon([point1, point2, point3, point4]);
  z = (zInfo.maxZ + zInfo.minZ) / 2;
  depth = zInfo.maxZ - zInfo.minZ;
  extraData = {
    count: zInfo.zCount,
  };
  // }

  if (selectedPointCloudBox) {
    z = selectedPointCloudBox.center.z;
    depth = selectedPointCloudBox.depth;
  }

  const newPosition = {
    center: {
      x: centerPoint.x,
      y: centerPoint.y,
      z,
    },
    width,
    height,
    depth,
    rotation,
    id: newPolygon.id,
  };

  /** TrackID will append before it pushed */
  const boxParams: Omit<IPointCloudBox, 'trackID'> = selectedPointCloudBox
    ? {
        ...selectedPointCloudBox,
        ...newPosition,
        ...extraData,
        rect: [point1, point2, point3, point4],
        zInfo: zInfo,
      }
    : {
        // Init Data
        ...newPosition,
        attribute: '',
        valid: true,
        ...extraData,
        order: 1,
        rect: [point1, point2, point3, point4],
        zInfo: zInfo,
        isVisible: true,
      };

  if (defaultValue) {
    Object.assign(boxParams, defaultValue);
  }

  return boxParams;
};

const sideViewPolygon2PointCloud = (
  newPolygon: any,
  originPolygon: any,
  selectedPointCloudBox: IPointCloudBox,
  pointCloudInstance: PointCloud,
) => {
  const [point1, point2, point3] = newPolygon.pointList;
  const [op1, op2, op3] = originPolygon.pointList;

  // 2D centerPoint => 3D x & z
  const newCenterPoint = MathUtils.getLineCenterPoint([point1, point3]);
  const oldCenterPoint = MathUtils.getLineCenterPoint([op1, op3]);

  const offset = {
    x: newCenterPoint.x - oldCenterPoint.x,
    y: newCenterPoint.y - oldCenterPoint.y,
  };

  const cos = Math.cos(selectedPointCloudBox.rotation);
  const sin = Math.sin(selectedPointCloudBox.rotation);

  const offsetCenterPoint = {
    x: offset.x,
    y: offset.x * sin + offset.y * cos,
    z: newCenterPoint.y - oldCenterPoint.y,
  };

  // 2D height => 3D depth
  const height = MathUtils.getLineLength(point1, point2);
  const oldHeight = MathUtils.getLineLength(op1, op2);
  const offsetHeight = height - oldHeight; // 3D depth

  // 2D width => 3D width
  const width = MathUtils.getLineLength(point2, point3);
  const oldWidth = MathUtils.getLineLength(op2, op3);
  const offsetWidth = width - oldWidth; // 3D width

  const { newBoxParams } = pointCloudInstance.getNewBoxBySideUpdate(
    offsetCenterPoint,
    offsetWidth,
    offsetHeight,
    selectedPointCloudBox,
  );

  return newBoxParams;
};

/**
 * NewBox synchronize sideView
 * @param boxParams
 * @param newPolygon TODO！ Need to add type
 */
export const synchronizeSideView = async (
  boxParams: IPointCloudBox,
  newPolygon: any,
  sideViewInstance: PointCloudAnnotation | undefined,
  newPoints: THREE.Points,
) => {
  if (!sideViewInstance) {
    return;
  }
  const { pointCloud2dOperation, pointCloudInstance } = sideViewInstance;
  // Create PointCloud
  // await pointCloudInstance.loadPCDFileByBox(url, boxParams, {
  //   width: DEFAULT_SCOPE,
  //   depth: DEFAULT_SCOPE,
  // });
  const { cameraPositionVector } = pointCloudInstance.updateOrthoCamera(
    boxParams,
    EPerspectiveView.Left,
  );
  newPoints.name = 'selectedPointCloud';
  pointCloudInstance.scene.add(newPoints);
  pointCloudInstance.setInitCameraPosition(cameraPositionVector);

  pointCloudInstance.setSelectedPointCloud(newPoints);
  // Create Draw Polygon
  const { polygon2d, zoom } = pointCloudInstance.getBoxSidePolygon2DCoordinate(boxParams);

  // Synchronize SidePointCloud zoom with PointCloud2dOperation
  pointCloudInstance.camera.zoom = zoom;
  pointCloudInstance.camera.updateProjectionMatrix();
  pointCloudInstance.render();

  // Update PolygonView to default zoom and currentPos.
  // await pointCloud2dOperation.initPosition();
  pointCloud2dOperation.zoomChangeOnCenter(zoom);
  pointCloud2dOperation.setResultAndSelectedID(
    [
      // @ts-ignore
      {
        id: newPolygon.id,
        valid: boxParams.valid,
        pointList: polygon2d,
        textAttribute: '',
        isRect: true,
        // attribute: pointCloud2dOperation.defaultAttribute,
      },
    ],
    newPolygon.id,
  );
};

/**
 * NewBox synchronize backView
 * @param boxParams
 * @param newPolygon TODO！ Need to add type
 */
export const synchronizeBackView = async (
  boxParams: IPointCloudBox,
  newPolygon: any,
  BackViewInstance: PointCloudAnnotation,
  newPoints: THREE.Points,
) => {
  if (!BackViewInstance) {
    return;
  }
  const {
    pointCloud2dOperation: backPointCloudPolygonOperation,
    pointCloudInstance: backPointCloud,
  } = BackViewInstance;
  // Create PointCloud
  // backPointCloud.loadPCDFileByBox(url, boxParams, { height: DEFAULT_SCOPE, depth: DEFAULT_SCOPE });
  const { cameraPositionVector } = backPointCloud.updateOrthoCamera(
    boxParams,
    EPerspectiveView.Back,
  );
  newPoints.name = 'selectedPointCloud';
  backPointCloud.scene.add(newPoints);

  backPointCloud.setInitCameraPosition(cameraPositionVector);
  backPointCloud.setSelectedPointCloud(newPoints);

  // Create Draw Polygon
  const { polygon2d, zoom } = backPointCloud.getBoxBackPolygon2DCoordinate(boxParams);
  // Synchronize SidePointCloud zoom with PointCloud2dOperation
  backPointCloud.camera.zoom = zoom;
  backPointCloud.camera.updateProjectionMatrix();
  backPointCloud.render();
  // Update PolygonView to default zoom and currentPos.
  // await backPointCloudPolygonOperation.initPosition();
  backPointCloudPolygonOperation.zoomChangeOnCenter(zoom);
  backPointCloudPolygonOperation.setResultAndSelectedID(
    [
      // @ts-ignore
      {
        id: newPolygon.id,
        valid: boxParams.valid,
        pointList: polygon2d,
        textAttribute: '',
        isRect: true,
      },
    ],
    newPolygon.id,
  );
};

/**
 * NewBox synchronize TopView
 * @param boxParams
 * @param newPolygon TODO！ Need to add type
 */
export const synchronizeTopView = (
  newBoxParams: IPointCloudBox,
  newPolygon: any,
  topViewInstance?: PointCloudAnnotation,
  mainViewInstance?: PointCloudOperation,
) => {
  if (!topViewInstance || !mainViewInstance) {
    return;
  }
  // Control the 3D view data to create box (not add box from top view, to make sure)
  // mainViewInstance.generateBox(newBoxParams, newPolygon.id);
  // let zInfo = mainViewInstance?.getSensesPointZAxisInPolygon(newPolygon.pointList);
  // mainViewInstance.updateBoxInSene(newPolygon.pointList,zInfo,0xffffff,newPolygon.id);
  // not change main view when ajust other views (to make sure)
  // mainViewInstance.updateCameraByBox(newBoxParams, EPerspectiveView.Top);
  mainViewInstance.render();

  const { pointCloud2dOperation, pointCloudInstance } = topViewInstance;

  const { polygon2d } = pointCloudInstance.getBoxTopPolygon2DCoordinate(newBoxParams);

  const newPolygonList = [...pointCloud2dOperation.polygonList];
  const oldPolygon = newPolygonList.find((v) => v.id === newPolygon.id);
  if (oldPolygon) {
    oldPolygon.pointList = polygon2d;
  } else {
    newPolygonList.push(
      // @ts-ignore
      {
        id: newPolygon.id,
        pointList: polygon2d,
        textAttribute: '',
        isRect: true,
        valid: newBoxParams.valid ?? true,
        // attribute:pointCloud2dOperation.defaultAttribute
      },
    );
  }

  pointCloud2dOperation.setResultAndSelectedID(newPolygonList, newPolygon.id);
};

export const usePointCloudViews = () => {
  const ptCtx = useContext(PointCloudContext);
  const {
    topViewInstance,
    sideViewInstance,
    backViewInstance,
    mainViewInstance,
    addPointCloudBox,
    setSelectedIDs,
    selectedIDs,
    pointCloudBoxList,
    setPointCloudResult,
  } = ptCtx;
  const { updateSelectedBox } = useSingleBox();
  const { currentData, config } = useSelector((state: AppState) => {
    const { stepList, step, imgList, imgIndex } = state.annotation;

    return {
      currentData: imgList[imgIndex],
      config: jsonParser(StepUtils.getCurrentStepInfo(step, stepList).config),
    };
  });
  const dispatch = useDispatch();
  const { selectedBox } = useSingleBox();
  const { t } = useTranslation();

  const selectedPointCloudBox = selectedBox?.info;

  if (!topViewInstance || !sideViewInstance) {
    return {
      topViewAddBox: () => {},
      topViewSelectedChanged: () => {},
      sideViewUpdateBox: () => {},
    };
  }

  const { pointCloudInstance: topViewPointCloud } = topViewInstance;

  // Temporarily hide
  // const getNextTrackID = () => {
  //   if (pointCloudBoxList.length > 0) {
  //     const sortedPcList = pointCloudBoxList.sort((a, b) => a.trackID - b.trackID);
  //     return sortedPcList.slice(-1)[0]?.trackID + 1;
  //   }

  //   return 1;
  // };

  // const mainViewGenBox = (newBoxParams: IPointCloudBox) => {
  //   mainViewInstance?.generateBox(newBoxParams);
  //   mainViewInstance?.controls.update();
  //   mainViewInstance?.render();
  // };

  const updateMainViewGenBox = (polygon: IPolygonData) => {
    if (polygon.id) {
      let zInfo = mainViewInstance?.getSensesPointZAxisInPolygon(polygon.pointList);
      if (zInfo) {
        mainViewInstance?.updateBoxInSene(polygon.pointList, zInfo, polygon.attribute, polygon.id);
        mainViewInstance?.controls.update();
        mainViewInstance?.render();
      }
    }
  };

  /** Top-view create box from 2D */
  const topViewAddBox = (newPolygon: any, size: ISize, attribute: string) => {
    const newParams = topViewPolygon2PointCloud(newPolygon, size, topViewPointCloud, undefined, {
      attribute: attribute,
    });
    if (!newParams) {
      return;
    }
    const polygonOperation = topViewInstance?.pointCloud2dOperation;
    polygonOperation.initImgPos();
    let centerCoordinate = polygonOperation.getGetCenterCoordinate();
    // 视图中心点 在 图片中的坐标
    let centerPositionInImageWithOutZoom = {
      x: (centerCoordinate.x - polygonOperation.currentPos.x) / polygonOperation.zoom,
      y: (centerCoordinate.y - polygonOperation.currentPos.y) / polygonOperation.zoom,
    };
    let polygonPointList = newPolygon.pointList;
    // polygon 中心坐标
    let polygonCenter = {
      x: (polygonPointList[0].x + polygonPointList[2].x) / 2,
      y: (polygonPointList[0].y + polygonPointList[2].y) / 2,
    };

    // 将polygon 中心 移动至屏幕中心
    let offsetBetweenPolygonCenterAndViewCenter = {
      x: polygonCenter.x - centerPositionInImageWithOutZoom.x,
      y: polygonCenter.y - centerPositionInImageWithOutZoom.y,
    };

    let newCurrentPros = {
      x: polygonOperation.currentPos.x - offsetBetweenPolygonCenterAndViewCenter.x,
      y: polygonOperation.currentPos.y - offsetBetweenPolygonCenterAndViewCenter.y,
    };
    polygonOperation.setCurrentPos(newCurrentPros);
    const pointCloud = topViewInstance?.pointCloudInstance;
    const { zoom } = pointCloud.getBoxTopPolygon2DCoordinate(newParams);
    pointCloud.camera.zoom = zoom;
    pointCloud.camera.updateProjectionMatrix();
    pointCloud.render();

    // Temporarily hide
    // const boxParams: IPointCloudBox = Object.assign(newParams, {
    //   trackID: getNextTrackID(),
    // });
    const boxParams: IPointCloudBox = newParams;

    // If the count is less than lowerLimitPointsNumInBox, needs to delete it
    if (
      config?.lowerLimitPointsNumInBox &&
      typeof newParams.count === 'number' &&
      newParams.count < config.lowerLimitPointsNumInBox
    ) {
      message.info(t('LowerLimitPointsNumInBox', { num: config.lowerLimitPointsNumInBox }));
      polygonOperation.deletePolygon(newParams.id);
      return;
    }
    polygonOperation.zoomChangeOnCenter(zoom);

    polygonOperation.setSelectedID(newPolygon.id);
    setSelectedIDs([boxParams.id]);
    syncPointCloudViews(PointCloudView.Top, newPolygon, boxParams, true);
    addPointCloudBox(boxParams);
  };

  /** Top-view selected changed and render to other view */
  const topViewSelectedChanged = () => {
    const boxParams = selectedBox?.info;
    const polygonOperation = topViewInstance?.pointCloud2dOperation;

    polygonOperation.setSelectedIDs(selectedIDs);
    if (!boxParams || !polygonOperation) {
      return;
    }
    const polygon = polygonOperation.selectedPolygon;
    syncPointCloudViews(PointCloudView.Top, polygon, boxParams);
  };

  /**
   * Update box from view
   * @param newPolygon
   * @param originPolygon
   * @param fromView Back or Side
   */
  const viewUpdateBox = (newPolygon: any, originPolygon: any, fromView: string) => {
    if (selectedPointCloudBox) {
      let newBoxParams = sideViewPolygon2PointCloud(
        newPolygon,
        originPolygon,
        selectedPointCloudBox,
        sideViewInstance.pointCloudInstance,
      );
      // Update count
      if (mainViewInstance) {
        const { count } = mainViewInstance.getSensesPointZAxisInPolygon(
          mainViewInstance.getCuboidFromPointCloudBox(newBoxParams)
            .polygonPointList as IPolygonPoint[],
          [
            newBoxParams.center.z - newBoxParams.depth / 2,
            newBoxParams.center.z + newBoxParams.depth / 2,
          ],
        );

        newBoxParams = {
          ...newBoxParams,
          count,
        };
        let box = mainViewInstance.getCuboidFromPointCloudBox(newBoxParams)
          .polygonPointList as IPolygonPoint[];
        let topPolygon = {
          ...newPolygon,
          pointList: box,
        };
        updateSelectedBox(newBoxParams);
        syncPointCloudViewsFromSideOrBackView(fromView, newPolygon, newBoxParams, topPolygon);
      }
    }
  };

  const sideViewUpdateBox = (newPolygon: any, originPolygon: any) => {
    viewUpdateBox(newPolygon, originPolygon, PointCloudView.Side);
  };

  const backViewUpdateBox = (newPolygon: any, originPolygon: any) => {
    viewUpdateBox(newPolygon, originPolygon, PointCloudView.Back);
  };

  /**
   * Top view box updated and sync views
   * @param polygon
   * @param size
   */
  const topViewUpdateBox = (polygon: any, size: ISize) => {
    if (selectedPointCloudBox) {
      const newBoxParams = topViewPolygon2PointCloud(
        polygon,
        size,
        topViewInstance.pointCloudInstance,
        selectedPointCloudBox,
      );

      if (!newBoxParams) {
        return;
      }
      Object.assign(
        selectedPointCloudBox,
        _.pickBy(newBoxParams, (v, k) => ['width', 'height', 'x', 'y']),
      );
      updateSelectedBox(newBoxParams);
      syncPointCloudViews(PointCloudView.Top, polygon, selectedPointCloudBox);
    }
  };

  /**
   * sync pointcloudview when side view change
   * @param omitView
   * @param polygon
   * @param boxParams
   * @param topPolygon
   */

  const syncPointCloudViewsFromSideOrBackView = async (
    omitView: string,
    polygon: any,
    boxParams: IPointCloudBox,
    topPolygon: any,
  ) => {
    const dataUrl = currentData?.url;

    const newPoints = (await mainViewInstance?.loadPCDFileByBox(dataUrl, boxParams, {
      width: DEFAULT_SCOPE,
      depth: DEFAULT_SCOPE,
    })) as unknown as THREE.Points;
    const viewToBeUpdated = {
      [PointCloudView.Side]: () => {
        if (sideViewInstance) {
          synchronizeSideView(boxParams, polygon, sideViewInstance, newPoints);
        }
      },
      [PointCloudView.Back]: () => {
        if (backViewInstance) {
          synchronizeBackView(boxParams, polygon, backViewInstance, newPoints);
        }
      },
      [PointCloudView.Top]: () => {
        synchronizeTopView(boxParams, polygon, topViewInstance, mainViewInstance);
      },
    };
    Object.keys(viewToBeUpdated).forEach((key) => {
      if (key !== omitView) {
        viewToBeUpdated[key]();
      }
    });

    updateMainViewGenBox(topPolygon);
  };

  /**
   * Sync views' data from omit view, regenerate and highlight box on 3D-view
   * @param omitView
   * @param polygon
   * @param boxParams
   */
  const syncPointCloudViews = async (
    omitView: string,
    polygon: any,
    boxParams: IPointCloudBox,
    is3DToOther?: boolean,
  ) => {
    const dataUrl = currentData?.url;

    const newPoints = (await mainViewInstance?.loadPCDFileByBox(dataUrl, boxParams, {
      width: DEFAULT_SCOPE,
      depth: DEFAULT_SCOPE,
    })) as unknown as THREE.Points;
    const viewToBeUpdated = {
      [PointCloudView.Side]: () => {
        if (sideViewInstance) {
          synchronizeSideView(boxParams, polygon, sideViewInstance, newPoints);
        }
      },
      [PointCloudView.Back]: () => {
        if (backViewInstance) {
          synchronizeBackView(boxParams, polygon, backViewInstance, newPoints);
        }
      },
      [PointCloudView.Top]: () => {
        synchronizeTopView(boxParams, polygon, topViewInstance, mainViewInstance);
      },
    };
    Object.keys(viewToBeUpdated).forEach((key) => {
      if (key !== omitView) {
        viewToBeUpdated[key]();
      }
    });
    // is add box from point Cloud
    if (!is3DToOther) {
      let wordPolygonPointList = polygon.pointList.map((point: { x: number; y: number }) => {
        const size = {
          width: topViewInstance?.pointCloud2dOperation.container.offsetWidth as number,
          height: topViewInstance?.pointCloud2dOperation.container.offsetHeight as number,
        };
        return MathUtils.transferCanvas2World(point, size);
      });

      let wordPolygon = {
        ...polygon,
        pointList: wordPolygonPointList,
        attribute: boxParams.attribute,
      };

      updateMainViewGenBox(wordPolygon);
    }
  };

  const pointCloudBoxListUpdated = (newBoxes: IPointCloudBox[]) => {
    topViewInstance.updatePolygonList(newBoxes);
    // revise add box methods (to make sure)
    // mainViewInstance?.generateBoxes(newBoxes);
  };

  const clearAllResult = () => {
    // Clear All PointView Data
    pointCloudBoxList.forEach((v: { id: any }) => {
      mainViewInstance?.removeObjectByName(v.id);
    });
    mainViewInstance?.render();

    setPointCloudResult([]);
    topViewInstance.pointCloud2dOperation.clearActiveStatus();
    topViewInstance.pointCloud2dOperation.clearResult();
  };

  const initPointCloud3d = () => {
    if (!mainViewInstance) {
      return;
    }

    mainViewInstance.initPerspectiveCamera();
    mainViewInstance.initRenderer();
    mainViewInstance.render();
  };

  /**
   * Update the data of pointCloudView when the page change.
   * @returns
   */
  const updatePointCloudData = async () => {
    if (!currentData?.url || !mainViewInstance) {
      return;
    }
    SetPointCloudLoading(dispatch, true);
    await mainViewInstance.loadPCDFile(currentData.url, config?.radius ?? DEFAULT_RADIUS);

    // Clear All Data
    pointCloudBoxList.forEach((v: { id: any }) => {
      mainViewInstance?.removeObjectByName(v.id);
    });
    if (currentData.result) {
      const boxParamsList = PointCloudUtils.getBoxParamsFromResultList(currentData.result);
      const polygonList = PointCloudUtils.getPolygonListFromResultList(currentData.result);

      // Add Init Box
      boxParamsList.forEach((v: IPointCloudBox) => {
        // mainViewInstance?.generateBox(v);
        if (v.isVisible) {
          mainViewInstance?.doUpateboxInScene(v.rect, v.zInfo, v.attribute, v.id);
        }
      });

      ptCtx.setPointCloudResult(boxParamsList);
      ptCtx.setPolygonList(polygonList);
    } else {
      ptCtx.setPointCloudResult([]);
      ptCtx.setPolygonList([]);
    }

    mainViewInstance.updateTopCamera();

    const valid = jsonParser(currentData.result?.pointCloudTool?.result)?.valid ?? true;
    ptCtx.setPointCloudValid(valid);
    // Clear other view data during initialization
    ptCtx?.sideViewInstance?.clearAllData();
    ptCtx?.backViewInstance?.clearAllData();

    // TopView Data Update
    /**
     * Listen to flip
     * 1. Init
     * 2. Reload PointCloud
     * 3. Clear Polygon
     */
    topViewInstance.updateData(currentData.url, currentData.result, {
      radius: config?.radius ?? DEFAULT_RADIUS,
    });
    SetPointCloudLoading(dispatch, false);
  };

  return {
    syncPointCloudViewsFromSideOrBackView,
    topViewAddBox,
    topViewSelectedChanged,
    topViewUpdateBox,
    sideViewUpdateBox,
    backViewUpdateBox,
    pointCloudBoxListUpdated,
    clearAllResult,
    initPointCloud3d,
    updatePointCloudData,
  };
};
