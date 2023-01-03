import { useCallback, useContext } from 'react';
import { IAnnotationStateProps } from '@/store/annotation/map';
import { synchronizeBackView, synchronizeSideView } from './usePointCloudViews';
import { useSingleBox } from './useSingleBox';
import { PointCloudContext } from '../PointCloudContext';
import { cAnnotation } from '@label-u/annotation';
import { PointCloudUtils } from '@label-u/utils';

const { ERotateDirection } = cAnnotation;

/**
 * PointCloud Rotate Hook
 * @returns
 */
export const useRotate = ({ currentData }: IAnnotationStateProps) => {
  const ptCtx = useContext(PointCloudContext);
  const { selectedBox, updateSelectedBox } = useSingleBox();

  const updateRotate = useCallback(
    (angle: number) => {
      const { topViewInstance, mainViewInstance } = ptCtx;
      if (!topViewInstance || !mainViewInstance) {
        return;
      }

      const { pointCloud2dOperation: TopPointCloudPolygonOperation } = topViewInstance;

      const selectedPointCloudBox = selectedBox?.info;

      if (!selectedPointCloudBox || !currentData?.url || !ptCtx.backViewInstance) {
        return;
      }

      updateSelectedBox({
        rotation: PointCloudUtils.restrictAngleRange(
          selectedPointCloudBox.rotation + Number(Math.PI * angle) / 180,
        ),
      });

      TopPointCloudPolygonOperation.rotatePolygon(angle, ERotateDirection.Anticlockwise);
      const selectedPolygon = TopPointCloudPolygonOperation.selectedPolygon;

      mainViewInstance.generateBox(selectedPointCloudBox);
      // alert("synchronizeSideView2")
      // mainViewInstance.highlightOriginPointCloud(selectedPointCloudBox);
      synchronizeSideView(
        selectedPointCloudBox,
        selectedPolygon,
        ptCtx.sideViewInstance,
        currentData.url,
      );
      synchronizeBackView(
        selectedPointCloudBox,
        selectedPolygon,
        ptCtx.backViewInstance,
        currentData.url,
      );
      mainViewInstance.render();
    },
    [
      ptCtx.selectedID,
      ptCtx.pointCloudBoxList,
      ptCtx.setPointCloudResult,
      ptCtx.topViewInstance,
      currentData,
    ],
  );

  return { updateRotate };
};
