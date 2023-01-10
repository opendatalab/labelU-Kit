import React, { FC, useEffect, useState } from 'react';
import Annotation from '../../components/business/annotation';
import { cloudMockFileList } from '../../mock/annotationMock';
import { useSelector, useDispatch } from 'react-redux';
import {
  updateToolsConfig,
  updateTagConfigList,
  updateAllAttributeConfigList,
  updateTextConfig
} from '../../stores/toolConfig.store';

import cloudToolConfig from '../../config/cloudPointConfig.json';
const AnnotationPage: FC = () => {
  const dispatch = useDispatch();
  const { tools, attribute } = useSelector(state => state.toolsConfig);
  // const currentIsVideo = StepUtils.currentToolIsVideo(1, stepConfig);
  const [fileList, setFileList] = useState<any[]>([]);
  // 加载工具配置信息 和 文件信息
  useEffect(() => {
    // 工具配置 todo=》补充配置拉取接口
    // @ts-ignore
    dispatch(updateToolsConfig(cloudToolConfig.tools));
    dispatch(updateAllAttributeConfigList(cloudToolConfig.attribute));
    // 配置标注文件 todo=》补充文件拉取接口
    let fList: any[] = cloudMockFileList.map((item, i) => ({
      id: i + 1,
      url: item.url,
      mappingImgList: item.mappingImgList,
      result: JSON.stringify({
        pctool: {
          toolName: 'pctool',
          result: [
            {
              "attribute": "奥迪",
              "center": {
                  "x": 32.56179434072837,
                  "y": 6.2644789567587615,
                  "z": -1.0284804105758667
              },
              "id": "0WZFG7wo",
              "rotation": 2.7999520289599724,
              "valid": true,
              "width": 23.686486683557717,
              "height": 10.738504347208883,
              "depth": 2.0569608211517334,
              "order": 2,
              "zInfo": {
                  "maxZ": 0,
                  "minZ": -2.0569608211517334,
                  "count": 0,
                  "zCount": 816
              },
              "rect": [
                  {
                      "x": 33.652855921462326,
                      "y": 19.222135626982418
                  },
                  {
                      "x": 23.53496979666152,
                      "y": 15.624378550610054
                  },
                  {
                      "x": 31.47073275999442,
                      "y": -6.693177713464895
                  },
                  {
                      "x": 41.58861888479522,
                      "y": -3.0954206370925306
                  }
              ]
          }
          ]
        }
      })
    }));
    setFileList(fList);
  }, []);

  const goBack = (data: any) => {
    console.log('goBack', data);
  };
  return (
    <>
      {fileList && fileList.length > 0 && tools && tools.length > 0 && (
        <Annotation
          attribute={attribute}
          tagList={[]}
          fileList={fileList}
          textConfig={[]}
          goBack={goBack}
          tools={tools}
        />
      )}
    </>
  );
};

export default AnnotationPage;
