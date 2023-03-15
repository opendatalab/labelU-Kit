import { getClassName } from '@/utils/dom';
import {
  cTool,
  MathUtils,
  PointCloudAnnotation,
  PointCloudConfig,
  ToolConfig,
} from '@label-u/annotation';
import { IPointCloudBox } from '@label-u/utils';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { PointCloudContext } from './PointCloudContext';
import { useRotate } from './hooks/useRotate';
import { useSingleBox } from './hooks/useSingleBox';
import { PointCloudContainer } from './PointCloudLayout';
import { PointCloudValidity } from './PointCloudInfos';
import { usePolygon } from './hooks/usePolygon';
import { useZoom } from './hooks/useZoom';
import { aMapStateToProps, IAnnotationStateProps } from '@/store/annotation/map';
import { connect } from 'react-redux';
import { LabelUContext } from '@/store/ctx';
import { usePointCloudViews } from './hooks/usePointCloudViews';
import useSize from '@/hooks/useSize';
import { useTranslation } from 'react-i18next';
import { BasicConfig } from '@/interface/toolConfig';
import { IPolygonData } from '@label-u/annotation/es/types/types/tool/polygon.d';
import * as THREE from 'three';

const { EPolygonPattern } = cTool;

/**
 * Get the offset from canvas2d-coordinate to world coordinate (Top View)
 * @param currentPos
 * @param size
 * @param zoom
 * @returns
 */
const TransferCanvas2WorldOffset = (
  currentPos: { x: number; y: number },
  size: { width: number; height: number },
  zoom = 1,
) => {
  const { width: w, height: h } = size;

  const canvasCenterPoint = {
    x: currentPos.x + (w * zoom) / 2,
    y: currentPos.y + (h * zoom) / 2,
  };

  const worldCenterPoint = {
    x: size.width / 2,
    y: size.height / 2,
  };

  return {
    offsetX: (worldCenterPoint.x - canvasCenterPoint.x) / zoom,
    offsetY: -(worldCenterPoint.y - canvasCenterPoint.y) / zoom,
  };
};

// TODO: set topview bar for top view
// const TopViewToolbar = ({ currentData }: IAnnotationStateProps) => {
//   const { zoom, zoomIn, zoomOut, initialPosition } = useZoom();
//   const { selectNextBox, selectPrevBox } = useSingleBox();
//   const { updateRotate } = useRotate({ currentData });
//   const ratio = 2;

//   const clockwiseRotate = () => {
//     updateRotate(-ratio);
//   };
//   const anticlockwiseRotate = () => {
//     updateRotate(ratio);
//   };

//   const reverseRotate = () => {
//     updateRotate(180);
//   };

//   return (
//     <>
//       <span
//         onClick={anticlockwiseRotate}
//         className={getClassName('point-cloud', 'rotate-reserve')}
//       />
//       <span onClick={clockwiseRotate} className={getClassName('point-cloud', 'rotate')} />
//       <span onClick={reverseRotate} className={getClassName('point-cloud', 'rotate-180')} />
//       {/* <FooterDivider /> */}
//       <UpSquareOutlined
//         onClick={() => {
//           selectPrevBox();
//         }}
//         className={getClassName('point-cloud', 'prev')}
//       />
//       <DownSquareOutlined
//         onClick={() => {
//           selectNextBox();
//         }}
//         className={getClassName('point-cloud', 'next')}
//       />

//       <FooterDivider />
//       <ZoomController
//         initialPosition={initialPosition}
//         zoomIn={zoomIn}
//         zoomOut={zoomOut}
//         zoom={zoom}
//       />
//     </>
//   );
// };

const PointCloudTopView: React.FC<
  IAnnotationStateProps & {
    config: BasicConfig & {
      config: PointCloudConfig;
    };
  }
> = ({ currentData, config }) => {
  const ref = useRef<HTMLDivElement>(null);
  const ptCtx = React.useContext(PointCloudContext);
  const size = useSize(ref);
  const { setZoom } = useZoom();

  const { addPolygon, deletePolygon, updatePolygon } = usePolygon();
  const { deletePointCloudBox, changeBoxValidByID } = useSingleBox();
  const { t } = useTranslation();
  const pointCloudViews = usePointCloudViews();
  const { updateRotate } = useRotate({ currentData });
  useLayoutEffect(() => {
    if (ptCtx.topViewInstance) {
      return;
    }
    if (ref.current && currentData?.url && currentData?.result) {
      const size = {
        width: ref.current.clientWidth,
        height: ref.current.clientHeight,
      };
      const pointCloudAnnotation = new PointCloudAnnotation({
        container: ref.current,
        config: config.config as ToolConfig,
        size,
        pcdPath: currentData.url,
      });
      pointCloudAnnotation.pointCloud2dOperation.setAllAttributes(config.config.attributeList);
      ptCtx.setTopViewInstance(pointCloudAnnotation);
    }
  }, [currentData]);

  useEffect(() => {
    if (!size || !ptCtx.topViewInstance || !ptCtx.sideViewInstance) {
      return;
    }

    const { pointCloud2dOperation: TopView2dOperation } = ptCtx.topViewInstance;

    TopView2dOperation.singleOn('polygonCreated', (polygon: IPolygonData) => {
      if (TopView2dOperation.pattern === EPolygonPattern.Normal || !currentData?.url) {
        addPolygon(polygon);
        return;
      }
      pointCloudViews.updateViewByTopPolygon(
        polygon,
        size,
        ptCtx.mainViewInstance?.attribute as string,
      );
    });

    TopView2dOperation.singleOn('polygonUpdate', async (polygon: IPolygonData) => {
      if (
        TopView2dOperation.pattern === EPolygonPattern.Normal ||
        !currentData?.url ||
        !ptCtx?.topViewInstance?.pointCloudInstance
      ) {
        updatePolygon(polygon);
        return;
      }

      ptCtx?.topViewInstance?.pointCloudInstance.setAngle(polygon.angle as number);
      if (ptCtx.selectedPointCloudBox) {
        pointCloudViews.updateViewByTopPolygon(
          polygon,
          size,
          ptCtx.selectedPointCloudBox.attribute,
          ptCtx.selectedPointCloudBox.textAttribute,
          ptCtx.selectedPointCloudBox.zInfo,
        );
      }
    });

    TopView2dOperation.singleOn('deletedObject', ({ id }: { id: string }) => {
      deletePointCloudBox(id);
      deletePolygon(id);
    });

    TopView2dOperation.singleOn('rotate', (rotate: number) => {
      updateRotate(rotate);
    });

    TopView2dOperation.singleOn('deleteSelectedIDs', () => {
      ptCtx.setSelectedIDs([]);
    });

    TopView2dOperation.singleOn('addSelectedIDs', (selectedID: string) => {
      ptCtx.addSelectedID(selectedID);
    });

    TopView2dOperation.singleOn('setSelectedIDs', (selectedIDs: string[]) => {
      ptCtx.setSelectedIDs(selectedIDs);
    });

    TopView2dOperation.singleOn('updatePolygonByDrag', ({ newPolygon, originPolygon }: any) => {
      pointCloudViews.topViewUpdateBox?.(newPolygon, originPolygon, size);
    });

    const validUpdate = (id: string) => {
      changeBoxValidByID(id);
    };

    TopView2dOperation.on('validUpdate', validUpdate);

    return () => {
      TopView2dOperation.unbind('validUpdate', validUpdate);
    };
  }, [ptCtx, size, currentData, pointCloudViews]);

  useEffect(() => {
    if (!size?.width || !ptCtx.topViewInstance) {
      return;
    }

    // 1. Update Size
    ptCtx.topViewInstance.initSize(size);
    ptCtx.topViewInstance.updatePolygonList(ptCtx.pointCloudBoxList);

    const {
      topViewInstance: { pointCloudInstance: pointCloud, pointCloud2dOperation: polygonOperation },
    } = ptCtx;

    polygonOperation.singleOn('resetView', async (box: IPointCloudBox) => {
      if (!ptCtx.topViewInstance) {
        return;
      }

      const polygonOperation = ptCtx.topViewInstance.pointCloud2dOperation;
      const pointCloud = ptCtx.topViewInstance?.pointCloudInstance;
      await pointCloud.loadPCDFile(currentData.url as string);
      const { zoom } = pointCloud.getBoxTopPolygon2DCoordinate(box);
      const size = {
        width: polygonOperation.container.clientWidth,
        height: polygonOperation.container.clientHeight,
      };
      const polygonPointList = box.rect.map((v: any) => MathUtils.transerWord2Canvas(v, size));

      polygonOperation.initImgPos();
      let centerCoordinate = polygonOperation.getGetCenterCoordinate();
      // 视图中心点 在 图片中的坐标
      let centerPositionInImageWithOutZoom = {
        x: (centerCoordinate.x - polygonOperation.currentPos.x) / polygonOperation.zoom,
        y: (centerCoordinate.y - polygonOperation.currentPos.y) / polygonOperation.zoom,
      };
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

      const TOMatrix = new THREE.Matrix4().makeTranslation(-box.center.x, -box.center.y, 0);
      const TBMatrix = new THREE.Matrix4().makeTranslation(box.center.x, box.center.y, 0);
      const RMatrix = new THREE.Matrix4().makeRotationZ((pointCloud.angle / 180) * Math.PI);
      const applyMatrix = new THREE.Matrix4()
        .multiply(TBMatrix)
        .multiply(RMatrix)
        .multiply(TOMatrix);
      let points = pointCloud.scene.getObjectByName('pointCloud');
      let ground = ptCtx?.topViewInstance?.pointCloudInstance.scene.getObjectByName('ground');
      points?.applyMatrix4(applyMatrix);
      ground?.applyMatrix4(applyMatrix);

      pointCloud.camera.zoom = zoom;
      pointCloud.camera.updateProjectionMatrix();
      pointCloud.render();
      polygonOperation.zoomChangeOnCenter(zoom);
      polygonOperation.setSelectedID(box.id);
    });

    /**
     * Synchronized 3d point cloud view displacement operations
     *
     * Change Orthographic Camera size
     */
    polygonOperation.singleOn('renderZoom', (zoom: number, currentPos: any) => {
      const { offsetX, offsetY } = TransferCanvas2WorldOffset(currentPos, size, zoom);
      pointCloud.camera.zoom = zoom;
      if (currentPos) {
        const { x, y, z } = pointCloud.initCameraPosition;
        pointCloud.camera.position.set(x + offsetY, y - offsetX, z);
      }

      pointCloud.camera.updateProjectionMatrix();
      pointCloud.render();

      setZoom(zoom);
    });

    // Synchronized 3d point cloud view displacement operations
    polygonOperation.singleOn(
      'dragMove',
      ({ currentPos, zoom }: { currentPos: { x: number; y: number }; zoom?: number }) => {
        const { offsetX, offsetY } = TransferCanvas2WorldOffset(currentPos, size, zoom);
        pointCloud.camera.zoom = zoom as number;
        const { x, y, z } = pointCloud.initCameraPosition;
        pointCloud.camera.position.set(x + offsetY, y - offsetX, z);
        pointCloud.render();
      },
    );
  }, [size, ptCtx.topViewInstance]);

  useEffect(() => {
    if (!ptCtx.topViewInstance) {
      return;
    }
    const {
      topViewInstance: { pointCloudInstance: pointCloud },
    } = ptCtx;
    pointCloud.camera.position.set(0, -1, 10);
    pointCloud.camera.updateProjectionMatrix();
    pointCloud.render();
    setZoom(1);
  }, [size]);

  // TODO: select box from topview
  // useEffect(() => {
  // pointCloudViews.topViewSelectedChanged();
  // }, [ptCtx.selectedIDs]);

  return (
    currentData && (
      <PointCloudContainer
        className={getClassName('point-cloud-container', 'top-view')}
        title={t('TopView')}
        // toolbar={<TopViewToolbar currentData={currentData} />}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <div id='mytool' style={{ width: '100%', height: '100%' }} ref={ref} />
          <PointCloudValidity />
        </div>
      </PointCloudContainer>
    )
  );
};

export default connect(aMapStateToProps, null, null, { context: LabelUContext })(PointCloudTopView);
