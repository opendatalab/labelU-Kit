import { getClassName } from '@/utils/dom';
import { ICoordinate, MathUtils, PointCloudOperation } from '@label-u/annotation';
import { EPerspectiveView, IPointCloudBox, PointCloudUtils } from '@label-u/utils';
import classNames from 'classnames';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PointCloudContainer } from './PointCloudLayout';
import { PointCloudContext } from './PointCloudContext';
import { aMapStateToProps, IAnnotationStateProps } from '@/store/annotation/map';
import { connect } from 'react-redux';
import { jsonParser } from '@/utils';
import { useSingleBox } from './hooks/useSingleBox';
// import { Switch } from 'antd';
import useSize from '@/hooks/useSize';
import { usePointCloudViews } from './hooks/usePointCloudViews';
// import { useTranslation } from 'react-i18next';
import { LabelUContext, useSelector } from '@/store/ctx';
import { BoxInfos } from './PointCloudInfos';
import { BasicConfig } from '@/interface/toolConfig';
import { AppState } from '@/store';

const pointCloudID = 'LABELU-POINTCLOUD';
const PointCloud3DContext = React.createContext<{
  isActive: boolean;
  setTarget3DView: (perspectiveView: EPerspectiveView) => void;
  reset3DView: () => void;
}>({
  isActive: false,
  setTarget3DView: () => {},
  reset3DView: () => {},
});

const PointCloudViewIcon = ({
  perspectiveView,
}: {
  perspectiveView: keyof typeof EPerspectiveView;
}) => {
  const { isActive, setTarget3DView } = useContext(PointCloud3DContext);

  const getTarget3DViewClassName = (position: string) => {
    return classNames({
      [getClassName('point-cloud-3d-view', position)]: true,
      active: isActive,
    });
  };

  return (
    <span
      onClick={() => {
        setTarget3DView(EPerspectiveView[perspectiveView]);
      }}
      className={getTarget3DViewClassName(perspectiveView.toLocaleLowerCase())}
    />
  );
};

const PointCloud3DSideBar = () => {
  const { reset3DView } = useContext(PointCloud3DContext);
  return (
    <div className={getClassName('point-cloud-3d-sidebar')}>
      <PointCloudViewIcon perspectiveView='Top' />
      <PointCloudViewIcon perspectiveView='Front' />
      <PointCloudViewIcon perspectiveView='Left' />
      <PointCloudViewIcon perspectiveView='Back' />
      <PointCloudViewIcon perspectiveView='Right' />
      <PointCloudViewIcon perspectiveView='LFT' />
      <PointCloudViewIcon perspectiveView='RBT' />
      <span
        onClick={() => {
          reset3DView();
        }}
        className={getClassName('point-cloud-3d-view', 'reset')}
      />
    </div>
  );
};

const PointCloud3D: React.FC<IAnnotationStateProps & { config: BasicConfig }> = ({ currentData,config }) => {
  const ptCtx = useContext(PointCloudContext);
  // const [showDirection, setShowDirection] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const { initPointCloud3d } = usePointCloudViews();
  const size = useSize(ref);
  // const { t } = useTranslation();
  const pointCloudViews = usePointCloudViews();
  const toolStyle = useSelector((state: AppState) => {
    return { ...state.toolStyle };
  });

  useEffect(() => {
    if (!ptCtx.mainViewInstance) {
      return;
    }
    initPointCloud3d?.();
  }, [size]);
  const { selectedBox } = useSingleBox();

  const setTarget3DView = (perspectiveView: EPerspectiveView) => {
    const box = selectedBox?.info;

    if (box) {
      ptCtx.mainViewInstance?.updateCameraByBox(box, perspectiveView);
    }
  };

  const reset3DView = () => {
    ptCtx.mainViewInstance?.resetCamera();
  };

  useEffect(() => {
    if (ref.current && currentData?.url) {
      let pointCloud = ptCtx.mainViewInstance;
      if (!pointCloud) {
        pointCloud = new PointCloudOperation({
          container: ref.current,
          // backgroundColor: '#4c4c4c',
          isOrthographicCamera: true,
          attribute: '',
          // @ts-ignore
          config:config.config,
        });
      }
      if (currentData.result) {
        const boxParamsList = PointCloudUtils.getBoxParamsFromResultList(currentData.result);

        // Add Init Box
        boxParamsList.forEach((v: IPointCloudBox) => {
          pointCloud?.generateBox(v);
        });

        ptCtx.setPointCloudResult(boxParamsList);
        ptCtx.setPointCloudValid(jsonParser(currentData.result)?.valid);
      }

      ptCtx.setMainViewInstance(pointCloud);
    }
  }, [currentData]);

  useEffect(() => {
    if (!size || !ptCtx.topViewInstance || !ptCtx.sideViewInstance || !ptCtx.mainViewInstance) {
      return;
    }

    const { pointCloud2dOperation: TopView2dOperation } = ptCtx.topViewInstance;
    const mainViewInstance = ptCtx.mainViewInstance;
    let sizeTop = {
      width: TopView2dOperation.container.getBoundingClientRect().width,
      height: TopView2dOperation.container.getBoundingClientRect().height,
    };
    mainViewInstance.singleOn(
      'boxAdded',
      (pointList: ICoordinate[], attribute: string, id: string) => {
        // const currentPolygonList = TopView2dOperation.polygonList;

        const cavasPointList = pointList.map((point) => {
          return MathUtils.transerWord2Canvas(point, sizeTop);
        });
        // bacause top view should only show the selected box so we should clear the previous polygon list
        // TopView2dOperation.setPolygonList([]);
        TopView2dOperation.drawingPointList = cavasPointList;
        TopView2dOperation.addDrawingPointToPolygonList(true, id);
        TopView2dOperation.setSelectedIDs([id]);
        TopView2dOperation.render();
        ptCtx.setSelectedIDs([id]);
      },
    );

    mainViewInstance.singleOn('updateSelectedBox', (selectedIDs: string) => {
      let size = {
        width:TopView2dOperation.container.clientWidth,
        height:TopView2dOperation.container.clientHeight
      }
      let [polygon] = TopView2dOperation.polygonList.filter(p => p.id === selectedIDs)
      pointCloudViews.topViewAddBox(polygon,size)
      ptCtx.setSelectedIDs([selectedIDs]);
    });

    mainViewInstance.setStyle(toolStyle);
    // return () => {
    //   TopView2dOperation.unbind('validUpdate', validUpdate);
    // };
  }, [ptCtx, size, currentData, pointCloudViews]);

  /**
   *  Observe selectedID and reset camera to target top-view
   */

  // do not change 3D view when add a box in point cloud scene
  // useEffect(() => {
  //   if (selectedBox) {
  //     setTarget3DView(EPerspectiveView.Top);
  //   }
  // }, [selectedBox]);

  const ptCloud3DCtx = useMemo(() => {
    return { reset3DView, setTarget3DView, isActive: !!selectedBox };
  }, [selectedBox]);

  // const PointCloud3DTitle = (
  //   <div>
  //     <span style={{ marginRight: 8 }}>{t('ShowArrows')}</span>
  //     <Switch
  //       size='small'
  //       checked={showDirection}
  //       onChange={(showDirection) => {
  //         setShowDirection(showDirection);
  //         ptCtx.mainViewInstance?.setShowDirection(showDirection);
  //       }}
  //     />
  //   </div>
  // );

  return (
    <PointCloudContainer
      className={getClassName('point-cloud-3d-container')}
      // title={t('3DView')}
      // toolbar={PointCloud3DTitle}
      style={{
        height:
          // currentData.mappingImgList && currentData.mappingImgList?.length > 0 ? '55%' : '100%',
          '100%',
      }}
    >
      <div className={getClassName('point-cloud-3d-content')} style={{ position: 'relative' }}>
        <PointCloud3DContext.Provider value={ptCloud3DCtx}>
          <PointCloud3DSideBar />
        </PointCloud3DContext.Provider>
        <BoxInfos />
        <div className={getClassName('point-cloud-3d-view')} id={pointCloudID} ref={ref} />
      </div>
    </PointCloudContainer>
  );
};

export default connect(aMapStateToProps, null, null, { context: LabelUContext })(PointCloud3D);
