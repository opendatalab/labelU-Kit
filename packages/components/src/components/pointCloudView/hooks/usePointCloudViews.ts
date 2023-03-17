import {
  PointCloudAnnotation,
  PointCloud,
  PointCloudOperation,
  MathUtils,
  ICoordinate,
  AxisUtils,
} from '@label-u/annotation';
import { IPointCloudBox, EPerspectiveView, PointCloudUtils, IPolygonPoint } from '@label-u/utils';
import { useContext } from 'react';
import { PointCloudContext } from '../PointCloudContext';
import { useSingleBox } from './useSingleBox';
import { ISize } from '@/types/main';
import _ from 'lodash-es';
import { useDispatch, useSelector } from '@/store/ctx';
import { AppState } from '@/store';
import StepUtils from '@/utils/StepUtils';
import { jsonParser } from '@/utils';
import { SetPointCloudLoading } from '@/store/annotation/actionCreators';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { IPolygonData } from '@label-u/annotation/es/types/types/tool/polygon.d';

const DEFAULT_SCOPE = 5;

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
        textAttribute: '',
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
        id: boxParams.id,
        valid: boxParams.valid,
        pointList: polygon2d,
        textAttribute: '',
        isRect: true,
        attribute: boxParams.attribute,
      },
    ],
    boxParams.id,
  );
};

/**
 * NewBox synchronize backView
 * @param boxParams
 * @param newPolygon TODO！ Need to add type
 */
export const synchronizeBackView = async (
  boxParams: IPointCloudBox,
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
        id: boxParams.id,
        valid: boxParams.valid,
        pointList: polygon2d,
        textAttribute: '',
        isRect: true,
        attribute: boxParams.attribute,
      },
    ],
    boxParams.id,
  );
};

/**
 * NewBox synchronize TopView
 * @param boxParams
 * @param newPolygon TODO！ Need to add type
 */
export const synchronizeTopView = (
  newBoxParams: IPointCloudBox,
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

  const rotateion = AxisUtils.getAngleFromRect(
    polygon2d as [ICoordinate, ICoordinate, ICoordinate, ICoordinate],
  );
  const newDrawingPoint = MathUtils.rotateRectPointList(
    -rotateion,
    polygon2d as [ICoordinate, ICoordinate, ICoordinate, ICoordinate],
  );
  pointCloudInstance.setAngle(rotateion);

  const newPolygonList = [...pointCloud2dOperation.polygonList];
  const oldPolygon = newPolygonList.find((v) => v.id === newBoxParams.id);
  if (oldPolygon) {
    oldPolygon.pointList = newDrawingPoint;
    oldPolygon.angle = rotateion;
  } else {
    newPolygonList.push(
      // @ts-ignore
      {
        id: newBoxParams.id,
        pointList: newDrawingPoint,
        textAttribute: '',
        isRect: true,
        valid: newBoxParams.valid ?? true,
        attribute: newBoxParams.attribute,
        angle: rotateion,
      },
    );
  }

  pointCloud2dOperation.setResultAndSelectedID(newPolygonList, newBoxParams.id);
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
      updateViewByTopPolygon: () => {},
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

  const unSetSelectId = (selectId: string | undefined) => {
    if (topViewInstance.pointCloud2dOperation.selectedID === selectId) {
      topViewInstance?.pointCloud2dOperation.setSelectedID(undefined);
      sideViewInstance?.pointCloud2dOperation.setSelectedID(undefined);
      backViewInstance?.pointCloud2dOperation.setSelectedID(undefined);

      sideViewInstance.pointCloudInstance.clearPointCloudAndRender();
      backViewInstance?.pointCloudInstance.clearPointCloudAndRender();
    }
  };

  const updateMainViewGenBox = (box: IPointCloudBox) => {
    if (box.id) {
      let zInfo = box.zInfo || mainViewInstance?.getSensesPointZAxisInPolygon(box.rect);
      if (zInfo) {
        let newBoxList = mainViewInstance?.doUpateboxInScene(
          box.rect,
          zInfo,
          box.attribute,
          box.id,
          box.textAttribute,
        );

        mainViewInstance?.emit('savePcResult', newBoxList);
        mainViewInstance?.updatePointCloudByAttributes(
          currentData.url as string,
          newBoxList as IPointCloudBox[],
        );
        mainViewInstance?.controls.update();
        mainViewInstance?.render();
      }
    }
  };

  const updateViewByTopPolygon = (
    newPolygon: IPolygonData,
    size: ISize,
    attribute: string,
    textAttribute?: string,
    zInfo?: {
      maxZ: number;
      minZ: number;
    },
    isReset = true,
  ) => {
    let polygonClone = { ...newPolygon };
    polygonClone.pointList = MathUtils.rotateRectPointList(
      newPolygon.angle,
      newPolygon.pointList as [ICoordinate, ICoordinate, ICoordinate, ICoordinate],
    );

    let newParams = topViewPolygon2PointCloud(polygonClone, size, topViewPointCloud, undefined, {
      attribute: attribute,
      textAttribute,
    });
    if (!newParams) {
      return;
    }
    if (zInfo) {
      newParams = {
        ...newParams,
        zInfo: zInfo,
        depth: zInfo.maxZ - zInfo.minZ,
      };
    }

    const boxParams: IPointCloudBox = newParams;
    const polygonOperation = topViewInstance?.pointCloud2dOperation;
    if (isReset) {
      polygonOperation.emit('resetView', boxParams);
    }

    // If the count is less than lowerLimitPointsNumInBox, needs to delete it
    if (
      config?.lowerLimitPointsNumInBox &&
      typeof newParams.count === 'number' &&
      newParams.count < config.lowerLimitPointsNumInBox
    ) {
      message.info(t('LowerLimitPointsNumInBox', { num: config.lowerLimitPointsNumInBox }));
      polygonOperation.deletePolygon(newParams.id);
      mainViewInstance?.deleteBox(newParams.id);
      return;
    }

    setSelectedIDs([boxParams.id]);
    syncPointCloudViews(PointCloudView.Top, boxParams);
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
    syncPointCloudViews(PointCloudView.Top, boxParams);
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
        let box = mainViewInstance.getCuboidFromPointCloudBox(newBoxParams).polygonPointList as [
          IPolygonPoint,
          IPolygonPoint,
          IPolygonPoint,
          IPolygonPoint,
        ];
        newBoxParams.rect = box;
        newBoxParams.zInfo = {
          maxZ: newBoxParams.center.z + newBoxParams.depth / 2,
          minZ: newBoxParams.center.z - newBoxParams.depth / 2,
        };
        // TODO: sycn data by sade view
        // mainViewInstance.emit('changeSelectedBox', box, newBoxParams.id);
        syncPointCloudViewsFromBox(newBoxParams);
        updateSelectedBox(newBoxParams);
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
  const topViewUpdateBox = async (
    polygon: IPolygonData,
    originPolygon: IPolygonData,
    size: ISize,
  ) => {
    if (selectedPointCloudBox) {
      let polygonClone = { ...polygon };

      let prevCenter = MathUtils.getRectCenterPoint(
        originPolygon.pointList as [ICoordinate, ICoordinate, ICoordinate, ICoordinate],
      );

      let newPointList = polygonClone.pointList.map((point: any) => {
        return AxisUtils.getRotatePoint(
          prevCenter,
          point,
          ((polygonClone.angle as number) / 180) * Math.PI,
        );
      });

      polygonClone.pointList = newPointList;
      const newBoxParams = topViewPolygon2PointCloud(
        polygonClone,
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

      await syncPointCloudViewsFromBox(newBoxParams);
    }
  };

  /**
   * sync pointcloudview when box change
   * @param omitView
   * @param polygon
   * @param boxParams
   * @param topPolygon
   */

  const syncPointCloudViewsFromBox = async (boxParams: IPointCloudBox) => {
    if (!ptCtx.topViewInstance?.pointCloud2dOperation.selectedID) {
      return;
    }
    const dataUrl = currentData?.url;

    const newPoints = (await mainViewInstance?.loadPCDFileByBox(dataUrl, boxParams, {
      width: DEFAULT_SCOPE,
      depth: DEFAULT_SCOPE,
      height: DEFAULT_SCOPE,
    })) as unknown as THREE.Points;
    const viewToBeUpdated = {
      [PointCloudView.Side]: () => {
        if (sideViewInstance) {
          synchronizeSideView(boxParams, sideViewInstance, newPoints);
        }
      },
      [PointCloudView.Back]: () => {
        if (backViewInstance) {
          synchronizeBackView(boxParams, backViewInstance, newPoints);
        }
      },
      [PointCloudView.Top]: () => {
        synchronizeTopView(boxParams, topViewInstance, mainViewInstance);
      },
    };
    Object.keys(viewToBeUpdated).forEach((key) => {
      // TODO: reset all views
      // if (key !== omitView) {
      viewToBeUpdated[key]();
      // }
    });

    topViewInstance.pointCloud2dOperation.emit('resetView', boxParams);
    updateMainViewGenBox(boxParams);
  };

  /**
   * Sync views' data from omit view, regenerate and highlight box on 3D-view
   * @param omitView
   * @param polygon
   * @param boxParams
   */
  const syncPointCloudViews = async (omitView: string, boxParams: IPointCloudBox) => {
    const dataUrl = currentData?.url;
    const newPoints = (await mainViewInstance?.loadPCDFileByBox(dataUrl, boxParams, {
      width: DEFAULT_SCOPE,
      depth: DEFAULT_SCOPE,
      height: DEFAULT_SCOPE,
    })) as unknown as THREE.Points;

    const viewToBeUpdated = {
      [PointCloudView.Side]: () => {
        if (sideViewInstance) {
          synchronizeSideView(boxParams, sideViewInstance, newPoints);
        }
      },
      [PointCloudView.Back]: () => {
        if (backViewInstance) {
          synchronizeBackView(boxParams, backViewInstance, newPoints);
        }
      },
      [PointCloudView.Top]: () => {
        synchronizeTopView(boxParams, topViewInstance, mainViewInstance);
      },
    };
    Object.keys(viewToBeUpdated).forEach((key) => {
      if (key !== omitView) {
        viewToBeUpdated[key]();
      }
    });
    updateMainViewGenBox(boxParams);
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
    await mainViewInstance.loadPCDFile(currentData.url);

    // Clear All Data
    pointCloudBoxList.forEach((v: { id: any }) => {
      mainViewInstance?.removeObjectByName(v.id);
    });
    if (currentData.result) {
      const boxParamsList = PointCloudUtils.getBoxParamsFromResultList(currentData.result);
      const polygonList = PointCloudUtils.getPolygonListFromResultList(currentData.result);
      let boxList: IPointCloudBox[] = [];
      // Add Init Box
      boxParamsList.forEach((v: IPointCloudBox) => {
        // mainViewInstance?.generateBox(v);
        if (v.isVisible) {
          boxList = mainViewInstance?.doUpateboxInScene(
            v.rect,
            v.zInfo,
            v.attribute,
            v.id,
            v.textAttribute,
          );
        }
      });

      mainViewInstance?.emit('savePcResult', boxList);
      mainViewInstance?.updatePointCloudByAttributes(
        currentData.url as string,
        boxList as IPointCloudBox[],
      );
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
    topViewInstance.updateData(currentData.url, currentData.result);
    SetPointCloudLoading(dispatch, false);
  };

  return {
    unSetSelectId,
    syncPointCloudViewsFromBox,
    updateViewByTopPolygon,
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
