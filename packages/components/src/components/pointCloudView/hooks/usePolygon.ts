import { IPolygonData } from '@label-u/utils';
import { useContext } from 'react';
import { PointCloudContext } from '../PointCloudContext';

/**
 * PointCloud Polygon Hook
 * @returns
 */
export const usePolygon = () => {
  const { polygonList, setPolygonList } = useContext(PointCloudContext);

  const updatePolygon = (polygon: IPolygonData) => {
    let newPolygonList = polygonList.map((onePolygon: IPolygonData) => {
      if (onePolygon.id === polygon.id) {
        return polygon;
      }
      return onePolygon;
    });
    setPolygonList(newPolygonList);
  };

  const addPolygon = (polygon: IPolygonData) => {
    setPolygonList(polygonList.concat(polygon));
  };

  const deletePolygon = (id: string) => {
    const newPolygonList = polygonList.filter((v) => v.id !== id);
    setPolygonList([...newPolygonList]);
  };

  return { addPolygon, deletePolygon, updatePolygon };
};
