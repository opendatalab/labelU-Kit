import { useContext } from 'react';
import { PointCloudContext } from '../PointCloudContext';

export const UseStyle: any = () => {
  const { topViewInstance } = useContext(PointCloudContext);
  const updateTopViewPolygonStyle = (toolStyle: any) => {
    if (topViewInstance && topViewInstance.pointCloud2dOperation) {
      topViewInstance?.pointCloud2dOperation.setStyle(toolStyle);
    }
  };
  return {
    updateTopViewPolygonStyle,
  };
};
