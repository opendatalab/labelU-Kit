import { getClassName } from '@/utils/dom';
// import { FooterDivider } from '@/views/MainView/toolFooter';
// import { ZoomController } from '@/views/MainView/toolFooter/ZoomController';
import { DownSquareOutlined, UpSquareOutlined } from '@ant-design/icons';
import { cTool, PointCloudAnnotation, ToolConfig } from '@label-u/annotation';
import { IPolygonData } from '@label-u/utils';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PointCloudContext } from './PointCloudContext';
import { useRotate } from './hooks/useRotate';
import { useSingleBox } from './hooks/useSingleBox';
import { PointCloudContainer } from './PointCloudLayout';
import { BoxInfos, PointCloudValidity } from './PointCloudInfos';
import { usePolygon } from './hooks/usePolygon';
import { useZoom } from './hooks/useZoom';
import { Slider } from 'antd';
import { aMapStateToProps, IAnnotationStateProps } from '@/store/annotation/map';
import { connect } from 'react-redux';
import { useSelector } from '@/store/ctx';
import { usePointCloudViews } from './hooks/usePointCloudViews';
import useSize from '@/hooks/useSize';
import { useTranslation } from 'react-i18next';
import { LabelUContext } from '@/store/ctx';
import { AppState } from '@/store';
import { BasicConfig } from '@/interface/toolConfig';

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

const TopViewToolbar = ({ currentData }: IAnnotationStateProps) => {
  // const { zoom, zoomIn, zoomOut, initialPosition } = useZoom();
  const { selectNextBox, selectPrevBox } = useSingleBox();
  const { updateRotate } = useRotate({ currentData });
  const ratio = 2;

  const clockwiseRotate = () => {
    updateRotate(-ratio);
  };
  const anticlockwiseRotate = () => {
    updateRotate(ratio);
  };

  const reverseRotate = () => {
    updateRotate(180);
  };

  return (
    <>
      <span
        onClick={anticlockwiseRotate}
        className={getClassName('point-cloud', 'rotate-reserve')}
      />
      <span onClick={clockwiseRotate} className={getClassName('point-cloud', 'rotate')} />
      <span onClick={reverseRotate} className={getClassName('point-cloud', 'rotate-180')} />
      {/* <FooterDivider /> */}
      <UpSquareOutlined
        onClick={() => {
          selectPrevBox();
        }}
        className={getClassName('point-cloud', 'prev')}
      />
      <DownSquareOutlined
        onClick={() => {
          selectNextBox();
        }}
        className={getClassName('point-cloud', 'next')}
      />
      {/* <FooterDivider />
      <ZoomController
        initialPosition={initialPosition}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        zoom={zoom}
      /> */}
    </>
  );
};

/**
 * Slider for filtering Z-axis points
 */
// const ZAxisSlider = ({
//   setZAxisLimit,
//   zAxisLimit,
// }: {
//   setZAxisLimit: (value: number) => void;
//   zAxisLimit: number;
// }) => {
//   return (
//     <div style={{ position: 'absolute', top: 128, right: 8, height: '50%', zIndex: 20 }}>
//       <Slider
//         vertical
//         step={0.5}
//         max={10}
//         min={0.5}
//         defaultValue={zAxisLimit}
//         onAfterChange={(v: number) => {
//           setZAxisLimit(v);
//         }}
//       />
//     </div>
//   );
// };

const PointCloudTopView: React.FC<IAnnotationStateProps & { config: BasicConfig }> = ({
  currentData,
  config,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  // const polygonRef = useRef<HTMLDivElement>(null);
  const ptCtx = React.useContext(PointCloudContext);
  const size = useSize(ref);
  const { setZoom } = useZoom();

  const { addPolygon, deletePolygon } = usePolygon();
  const { deletePointCloudBox, changeBoxValidByID } = useSingleBox();
  // const [zAxisLimit, setZAxisLimit] = useState<number>(10);
  const { t } = useTranslation();
  const pointCloudViews = usePointCloudViews();
  const toolStyle = useSelector((state: AppState) => {
    return { ...state.toolStyle };
  });

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
        // polygonContainer: polygonRef.current,
        size,
        pcdPath: currentData.url,
      });
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
      pointCloudViews.topViewAddBox(polygon, size);
    });

    TopView2dOperation.singleOn('deletedObject', ({ id }: { id: string }) => {
      deletePointCloudBox(id);
      deletePolygon(id);
    });

    TopView2dOperation.singleOn('rotate',(rotate: number) => {

      updateRotate(rotate)

    })

    TopView2dOperation.singleOn('deleteSelectedIDs', () => {
      ptCtx.setSelectedIDs([]);
    });

    TopView2dOperation.singleOn('addSelectedIDs', (selectedID: string) => {
      ptCtx.addSelectedID(selectedID);
    });

    TopView2dOperation.singleOn('setSelectedIDs', (selectedIDs: string[]) => {
      ptCtx.setSelectedIDs(selectedIDs);
    });

    TopView2dOperation.singleOn('updatePolygonByDrag', ({ newPolygon }: any) => {
      pointCloudViews.topViewUpdateBox?.(newPolygon, size);
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
    ptCtx.topViewInstance.pointCloud2dOperation.setStyle(toolStyle);
  }, [size, ptCtx.topViewInstance]);

  // useEffect(()=>{
  //   if ( !ptCtx.topViewInstance) {
  //     return;
  //   }
  //   const {
  //     topViewInstance: { pointCloudInstance: pointCloud }
  //   } = ptCtx;
  //   pointCloud.camera.position.set(0, -1, 10);
  //   pointCloud.camera.updateProjectionMatrix();
  //   pointCloud.render();
  //   setZoom(1);
  // },[size])

  // useEffect(() => {
  //   ptCtx.topViewInstance?.pointCloudInstance?.applyZAxisPoints(zAxisLimit);
  // }, [zAxisLimit]);

  useEffect(() => {
    pointCloudViews.topViewSelectedChanged();
  }, [ptCtx.selectedIDs]);


  // const moveCp = ()=>{
  //   if(ptCtx&&ptCtx.topViewInstance){
  //     const pointCloud = ptCtx?.topViewInstance.pointCloudInstance

  //     const { x, y, z } = pointCloud.initCameraPosition;
  //     pointCloud.camera.position.set(x + 100, y - 100, z);
  //     pointCloud.render();
  //   }

  // }

  return (
    currentData && (
      <PointCloudContainer
        className={getClassName('point-cloud-container', 'top-view')}
        title={t('TopView')}
        toolbar={<TopViewToolbar currentData={currentData} />}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <div id='mytool' style={{ width: '100%', height: '100%' }} ref={ref} />
          {/* <BoxInfos /> */}
          {/* <ZAxisSlider zAxisLimit={zAxisLimit} setZAxisLimit={setZAxisLimit} /> */}
          <PointCloudValidity />
        </div>
      </PointCloudContainer>
    )
  );
};

export default connect(aMapStateToProps, null, null, { context: LabelUContext })(PointCloudTopView);
