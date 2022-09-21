import { decoderCreater } from '../../../service/map/MapDecoder';
import { parserCreater } from '../../..//service/map/MapParser';
import { FC, useEffect, useMemo, useState } from 'react';
import { CanvasMapData, MapVueInfo, Rect } from '../../../interface/virtualMachine';
import { mapColorMgr } from '../../..//service/map/MapColorMgr';

const MapBase: FC<MapVueInfo> = props => {
  const [rect, setRect] = useState({} as Rect);
  const [mapData, setMapData] = useState([] as number[]);

  const tmpMapData = useMemo(() => {
    let decodedMap = decoderCreater(0).decoderMap(props.map);
    let tmpMapData = parserCreater(0).parseMap(decodedMap) as CanvasMapData;
    setRect(tmpMapData.rect);
    setMapData(tmpMapData.mapData);
    return tmpMapData;
  }, []);

  useEffect(() => {
    const AREA_DISABLE_COLOR = [100, 100, 100, 100];
    let width = tmpMapData.rect.right - tmpMapData.rect.left + 1;
    let height = tmpMapData.rect.top - tmpMapData.rect.bottom + 1;
    let currentMapImage = document.getElementById('canvas' + props.mapId);
    // @ts-ignore
    let ctx = currentMapImage.getContext('2d');
    let clearCanvas = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, width, height);
    };
    let mapImageData = ctx.createImageData(width, height);
    let datas = tmpMapData.mapData;
    let i = 0;
    if (datas[0] == 0xaa) {
      let i = 0;
      // this.roomzones = JSON.parse(JSON.stringify(this.roomZones));
      for (let h = height - 1; h >= 0; h--) {
        for (let p = h * width; p < (h + 1) * width; i++, p++) {
          if (mapColorMgr.areaUnselectColorManager().getColor(datas[i])) {
            let uData = h == 0 ? undefined : datas[i - width] & 0xf0,
              dData = h == height - 1 ? undefined : datas[i + width] & 0xf0,
              lData = p == h * width ? undefined : datas[i - 1] & 0xf0,
              rData = p == (h + 1) * width - 1 ? undefined : datas[i + 1] & 0xf0,
              data = datas[i] & 0xf0,
              isLine =
                uData == undefined ||
                data != uData ||
                dData == undefined ||
                data != dData ||
                lData == undefined ||
                data != lData ||
                rData == undefined ||
                data != rData;
            let color = AREA_DISABLE_COLOR;
            if (datas[0] == 0xaa) {
              isLine = false;
            }
            // let color = AREA_DISABLE_COLOR;
            // @ts-ignore
            color = datas[i];
            if (mapColorMgr.areaUnselectColorManager().getColor(datas[i])) {
              mapColorMgr.areaUnselectColorManager().setColor(color, mapImageData.data, p * 4);
            }
          }
        }
      }
    } else {
      for (let h = height - 1; h >= 0; h--) {
        for (let p = h * width; p < (h + 1) * width; i++, p++) {
          // 区域模式
          let temp;
          // 默认填充数据
          if (datas[i] == 0xf8) {
            mapColorMgr.unbindColorManager().setColor(0xf8, mapImageData.data, p * 4);
            continue;
          }
          if ((datas[i] & 0x02) > 0) {
            temp = 4;
          } else if ((datas[i] & 0x01) > 0) {
            temp = 1;
          } else {
            temp = 0;
          }
          mapColorMgr.baseColorManager().setColor(temp, mapImageData.data, p * 4);
        }
      }
    }
    clearCanvas();
    ctx.putImageData(mapImageData, 0, 0);
  }, []);

  return (
    <>
      <canvas width={rect.top - rect.bottom} height={rect.right - rect.left} id={'canvas' + props.mapId}></canvas>
    </>
  );
};

export default MapBase;
