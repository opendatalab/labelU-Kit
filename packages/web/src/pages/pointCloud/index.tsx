import React, { FC, useEffect, useState } from 'react';
import Annotation from '../../components/business/annotation';
import { cloudMockFileList } from '../../mock/annotationMock';
import { useSelector, useDispatch } from 'react-redux';
import {
  updateToolsConfig,
  updateTagConfigList,
  updateAllAttributeConfigList,
  updateTextConfig,
} from '../../stores/toolConfig.store';

import cloudToolConfig from '../../config/cloudPointConfig.json';
const AnnotationPage: FC = () => {
  debugger;
  const dispatch = useDispatch();
  const { tools, attribute } = useSelector(state => state.toolsConfig);
  // const currentIsVideo = StepUtils.currentToolIsVideo(1, stepConfig);
  const [fileList, setFileList] = useState<any[]>([]);
  // 加载工具配置信息 和 文件信息
  useEffect(() => {

    debugger;
    // 工具配置 todo=》补充配置拉取接口
    // @ts-ignore
    dispatch(updateToolsConfig(cloudToolConfig.tools));
    dispatch(updateAllAttributeConfigList(cloudToolConfig.attribute));
    // 配置标注文件 todo=》补充文件拉取接口
    let fList: any[] = cloudMockFileList.map((item, i) => ({
      id: i + 1,
      url:item.url,
      mappingImgList:item.mappingImgList,
      result: JSON.stringify([])
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
