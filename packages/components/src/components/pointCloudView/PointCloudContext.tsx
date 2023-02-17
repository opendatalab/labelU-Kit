import { IPointCloudBox, IPointCloudBoxList, IPolygonData } from '@label-u/utils';
import {
  PointCloudAnnotation,
  PointCloudOperation,
  PcZRange,
  PointSize,
  Radiuses,
} from '@label-u/annotation';
import React, { useMemo, useState } from 'react';

interface IPointCloudContextInstances {
  topViewInstance?: PointCloudAnnotation;
  sideViewInstance?: PointCloudAnnotation;
  backViewInstance?: PointCloudAnnotation;
  mainViewInstance?: PointCloudOperation;
  setTopViewInstance: (instance: PointCloudAnnotation) => void;
  setSideViewInstance: (instance: PointCloudAnnotation) => void;
  setBackViewInstance: (instance: PointCloudAnnotation) => void;
  setMainViewInstance: (instance: PointCloudOperation) => void;
}

export interface IPointCloudContext extends IPointCloudContextInstances {
  pointCloudBoxList: IPointCloudBoxList;
  selectedIDs: string[];
  setSelectedIDs: (ids?: string[] | string) => void;
  valid: boolean;
  setPointCloudResult: (resultList: IPointCloudBoxList) => void;
  selectedPointCloudBox?: IPointCloudBox;
  setPointCloudValid: (valid?: boolean) => void;
  addSelectedID: (selectedID: string) => void;
  selectedAllBoxes: () => void;
  selectedID: string;
  addPointCloudBox: (boxParams: IPointCloudBox) => void;

  polygonList: IPolygonData[];
  setPolygonList: (polygonList: IPolygonData[]) => void;

  zoom: number;
  setZoom: (zoom: number) => void;
  radiuses: string;
  zRange: [number, number];
  pointSize: number;
  setRadiuses: (radiuses: string) => void;
  setZrange: (zRange: [number, number]) => void;
  setPointSize: (pointSize: number) => void;
}

export const PointCloudContext = React.createContext<IPointCloudContext>({
  pointCloudBoxList: [],
  polygonList: [],
  selectedID: '',
  selectedIDs: [],
  valid: true,
  radiuses: `${Radiuses}`,
  zRange: PcZRange as [number, number],
  pointSize: PointSize,
  zoom: 1,
  setSelectedIDs: () => {},
  setPointCloudResult: () => {},
  setPointCloudValid: () => {},
  setTopViewInstance: () => {},
  setSideViewInstance: () => {},
  setBackViewInstance: () => {},
  setMainViewInstance: () => {},
  addSelectedID: () => {},
  selectedAllBoxes: () => {},
  addPointCloudBox: () => {},
  setPolygonList: () => {},
  setRadiuses: () => {},
  setZrange: () => {},
  setPointSize: () => {},
  setZoom: () => {},
});

export const PointCloudProvider: React.FC<{}> = ({ children }) => {
  const [pointCloudBoxList, setPointCloudResult] = useState<IPointCloudBoxList>([]);
  const [polygonList, setPolygonList] = useState<IPolygonData[]>([]);
  const [selectedIDs, setSelectedIDsState] = useState<string[]>([]);
  const [valid, setValid] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const [topViewInstance, setTopViewInstance] = useState<PointCloudAnnotation>();
  const [sideViewInstance, setSideViewInstance] = useState<PointCloudAnnotation>();
  const [backViewInstance, setBackViewInstance] = useState<PointCloudAnnotation>();
  const [mainViewInstance, setMainViewInstance] = useState<PointCloudOperation>();
  const [radiuses, setRadiuses] = useState<string>('80');
  const [zRange, setZrange] = useState<[number, number]>([-5, 10]);
  const [pointSize, setPointSize] = useState<number>(1);

  const selectedID = useMemo(() => {
    return selectedIDs.length === 1 ? selectedIDs[0] : '';
  }, [selectedIDs]);

  const ptCtx = useMemo(() => {
    const selectedPointCloudBox = pointCloudBoxList.find((v) => v.id === selectedID);

    const addPointCloudBox = (box: IPointCloudBox) => {
      if (pointCloudBoxList) {
        let newPointCloudBoxList = [];
        for (let pcBox of pointCloudBoxList) {
          if (pcBox.id !== box.id) {
            newPointCloudBoxList.push(pcBox);
          }
        }
        setPointCloudResult(newPointCloudBoxList.concat(box));
      }
    };

    const setPointCloudValid = (valid?: boolean) => {
      setValid(valid === false ? false : true);
    };

    const setSelectedIDs = (selectedIDs?: string[] | string) => {
      if (selectedIDs === undefined) {
        setSelectedIDsState([]);
      }

      if (typeof selectedIDs === 'string') {
        setSelectedIDsState([selectedIDs]);
      }

      if (Array.isArray(selectedIDs)) {
        setSelectedIDsState(Array.from(new Set(selectedIDs)));
      }
    };

    /**
     * If selectedID existed, remove selectedID from selectedIDs
     * If selectedID not existed, add selectedID to selectedIDs
     * @param selectedID
     */
    const addSelectedID = (selectedID: string) => {
      if (selectedIDs.includes(selectedID)) {
        setSelectedIDs(selectedIDs.filter((i) => i !== selectedID));
      } else {
        setSelectedIDs([...selectedIDs, selectedID]);
      }
    };

    const selectedAllBoxes = () => {
      setSelectedIDs(pointCloudBoxList.map((i) => i.id));
    };

    return {
      selectedID,
      pointCloudBoxList,
      selectedIDs,
      setPointCloudResult,
      setSelectedIDs,
      addPointCloudBox,
      valid,
      selectedPointCloudBox,
      setPointCloudValid,
      addSelectedID,
      selectedAllBoxes,
      topViewInstance,
      setTopViewInstance,
      sideViewInstance,
      setSideViewInstance,
      backViewInstance,
      setBackViewInstance,
      mainViewInstance,
      setMainViewInstance,
      polygonList,
      setPolygonList,
      zoom,
      setZoom,
      radiuses,
      setRadiuses,
      zRange,
      setZrange,
      pointSize,
      setPointSize,
    };
  }, [
    valid,
    selectedIDs,
    pointCloudBoxList,
    polygonList,
    topViewInstance,
    sideViewInstance,
    backViewInstance,
    mainViewInstance,
    zoom,
    zRange,
    pointSize,
    radiuses,
  ]);

  return <PointCloudContext.Provider value={ptCtx}>{children}</PointCloudContext.Provider>;
};
