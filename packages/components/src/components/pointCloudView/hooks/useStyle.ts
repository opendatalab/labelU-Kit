import { useContext } from 'react';
import { PointCloudContext } from '../PointCloudContext';

export const useStyle: any = () => {
  const { topViewInstance, sideViewInstance, backViewInstance } = useContext(PointCloudContext);
  const update3ViewPolygonStyle = (toolStyle: any) => {
    if (topViewInstance?.pointCloud2dOperation) {
      topViewInstance?.pointCloud2dOperation.setStyle(toolStyle);
    }
    if (sideViewInstance?.pointCloud2dOperation) {
      sideViewInstance?.pointCloud2dOperation.setStyle(toolStyle);
    }
    if (backViewInstance?.pointCloud2dOperation) {
      backViewInstance?.pointCloud2dOperation.setStyle(toolStyle);
    }
  };
  return {
    update3ViewPolygonStyle,
  };
};
