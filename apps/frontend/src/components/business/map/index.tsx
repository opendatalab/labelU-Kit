import { FC, useMemo, useState } from 'react';
import { MapInfo, MapVueInfo } from '../../../interface/virtualMachine';
import MapBase from './VC7Map';

const Map: FC<{ props: MapInfo }> = ({ props }) => {
  const [mapInfo, setMapInfo] = useState<MapVueInfo>({
    map: '', // 地图信息
    locus: '', // 轨迹信息
    partirion: '', // 分区地图信息
    partition_name_desc: '', // 分区命名信息
    partition_no: '', // 分区号
    partition_name: '', // 分区名
    virtual_wall: '', // 虚拟墙信息
    restricted_area: '', // 禁区
    mopping_restricted_area: '', // 拖地禁区
    charge_home: '',
    // mode,
  });

  const initMap = useMemo(async () => {
    let mapInfo: MapVueInfo = {
      map: props.data,
      locus: '', // 轨迹信息
      partirion: '', // 分区地图信息
      partition_name_desc: '', // 分区命名信息
      partition_no: '', // 分区号
      partition_name: '', // 分区名
      virtual_wall: '', // 虚拟墙信息
      restricted_area: '', // 禁区
      mopping_restricted_area: '', // 拖地禁区
      charge_home: '',
      mapId: props.mapId,
    };
    setMapInfo(mapInfo);
  }, []);

  return (
    <>
      <MapBase {...mapInfo} />
    </>
  );
};

export default Map;
