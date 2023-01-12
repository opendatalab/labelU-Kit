import React, { FC, useEffect, useState } from 'react';
import Annotation from '../../components/business/annotation';
import { fileList as mockFileList, videoList } from '../../mock/annotationMock';
import { useSelector, useDispatch } from 'react-redux';
import {
  updateToolsConfig,
  updateTagConfigList,
  updateAllAttributeConfigList,
  updateTextConfig,
} from '../../stores/toolConfig.store';

import toolCombineConfig from '../../config/toolCombineConfig.json';
const AnnotationPage: FC = () => {
  const dispatch = useDispatch();
  const { tools, tagList, attribute, textConfig } = useSelector(state => state.toolsConfig);
  // const currentIsVideo = StepUtils.currentToolIsVideo(1, stepConfig);
  const currentIsVideo = false;
  const [fileList, setFileList] = useState<any[]>([]);


  // const leftSiderContent = ()=>{
  //   return (
  //     <h1>左边栏预留</h1>
  //   )
  // }

  const leftSiderContent = (<div>lefstSider</div>)

  const topActionContent = () => {
    return (
      <h1>顶部预dddfsdfs留</h1>
    )
  }

  // 加载工具配置信息 和 文件信息
  useEffect(() => {
    // 工具配置 todo=》补充配置拉取接口
    // @ts-ignore
    dispatch(updateToolsConfig(toolCombineConfig.tools));
    dispatch(updateTagConfigList(toolCombineConfig.tagList));
    dispatch(updateAllAttributeConfigList(toolCombineConfig.attribute));
    // @ts-ignore
    dispatch(updateTextConfig(toolCombineConfig.textConfig));
    // 配置标注文件 todo=》补充文件拉取接口
    let fList: any[] = (currentIsVideo ? videoList : mockFileList).map((url, i) => ({
      id: i + 1,
      url,
      result:i===0? JSON.stringify({"width":720,"height":1280,"valid":true,"rotate":0,"lineTool":{"toolName":"lineTool","result":[{"pointList":[{"x":1028.6745098039216,"y":88.65882352941176,"id":"x06v7jO5"},{"x":930.1647058823529,"y":166.23529411764704,"id":"erVjJE5e"},{"x":920.313725490196,"y":174.8549019607843,"id":"MkNx2iWi"},{"x":954.7921568627451,"y":178.54901960784312,"id":"NLp75g93"},{"x":1054.5333333333333,"y":177.31764705882352,"id":"D6QcfcOT"},{"x":1139.4980392156863,"y":188.39999999999998,"id":"bSGvHfj0"},{"x":1258.9411764705883,"y":169.92941176470586,"id":"7ddeJ4WB"},{"x":1313.1215686274509,"y":135.45098039215685,"id":"U6M1L3Ge"},{"x":1281.105882352941,"y":118.21176470588235,"id":"smJ5CiIl"},{"x":1202.2980392156862,"y":121.90588235294118,"id":"jJa1GyA9"},{"x":1207.2235294117647,"y":77.5764705882353,"id":"j3RPtXgz"},{"x":1178.9019607843136,"y":84.96470588235293,"id":"j0Perkvh"},{"x":1124.721568627451,"y":112.0549019607843,"id":"Lv5mKDfA"},{"x":1076.6980392156863,"y":107.12941176470588,"id":"6HKjj9p4"},{"x":1026.2117647058824,"y":84.96470588235293,"id":"tw8hP0ZE"},{"x":1020.0549019607843,"y":91.12156862745097,"id":"t4Utlgvt"},{"x":1034.8313725490195,"y":91.12156862745097,"id":"flKBpIxK"},{"x":756.5411764705882,"y":94.8156862745098,"id":"i8GGzvAc"}],"id":"PiToaNuO","valid":true,"order":1,"isVisible":true,"attribute":"类别II"},{"pointList":[{"x":1560.627450980392,"y":148.99607843137255,"id":"Uq2TrX77"},{"x":1483.0509803921568,"y":168.69803921568626,"id":"n40O4g8b"},{"x":1457.192156862745,"y":206.8705882352941,"id":"KuRgkW1R"},{"x":1547.0823529411764,"y":251.2,"id":"P6Gf5xaC"},{"x":1684.9960784313726,"y":258.5882352941176,"id":"e7VoaGV1"},{"x":1774.8862745098038,"y":216.72156862745098,"id":"9steIZTG"},{"x":1769.9607843137253,"y":152.69019607843137,"id":"tISLheoi"},{"x":1746.5647058823529,"y":139.14509803921567,"id":"pg4np11v"},{"x":1709.6235294117646,"y":168.69803921568626,"id":"xb0RjcqO"},{"x":1638.2039215686273,"y":194.55686274509802,"id":"eTHhcbLb"},{"x":1603.7254901960785,"y":169.92941176470586,"id":"7pIqPTEq"},{"x":1641.8980392156861,"y":110.8235294117647,"id":"Ti1bNNye"},{"x":1527.3803921568626,"y":110.8235294117647,"id":"6ITZGYrm"},{"x":1552.007843137255,"y":181.01176470588234,"id":"bZ6ckq4N"},{"x":1569.2470588235294,"y":182.24313725490194,"id":"PcZXRbaW"},{"x":1563.0901960784313,"y":181.01176470588234,"id":"yj8Z1zO2"}],"id":"Nw5caNRX","valid":true,"order":2,"isVisible":true,"attribute":"类别Xu"},{"pointList":[{"x":1481.8196078431372,"y":386.65098039215684,"id":"hhTAuSlf"},{"x":1351.2941176470588,"y":374.33725490196076,"id":"XSMl9Zsc"},{"x":1364.8392156862744,"y":414.9725490196078,"id":"Be7AckLr"},{"x":1555.7019607843135,"y":480.235294117647,"id":"ex4l8qzP"},{"x":1672.6823529411763,"y":440.8313725490196,"id":"6YufbWmN"},{"x":1698.5411764705882,"y":419.89803921568625,"id":"G66yro42"},{"x":1750.2588235294118,"y":350.94117647058823,"id":"jvtD2caq"},{"x":1611.113725490196,"y":353.4039215686274,"id":"1hotOqCB"},{"x":1623.427450980392,"y":428.5176470588235,"id":"W0SlOiHa"},{"x":1533.5372549019608,"y":448.2196078431372,"id":"buI53KB7"},{"x":1501.521568627451,"y":376.79999999999995,"id":"rJyi0Gq1"},{"x":1559.3960784313724,"y":342.321568627451,"id":"VPrplvow"},{"x":1474.4313725490194,"y":392.8078431372549,"id":"6PG1roGH"},{"x":1479.356862745098,"y":417.43529411764706,"id":"nJpDuHGj"},{"x":1433.7960784313725,"y":261.0509803921569,"id":"gniCrcjY"},{"x":1455.9607843137255,"y":302.9176470588235,"id":"Kuva3fSu"},{"x":1500.2901960784313,"y":343.5529411764706,"id":"12bhLiLe"},{"x":1502.7529411764706,"y":364.4862745098039,"id":"N84M5tCy"}],"id":"okyIiA02","valid":true,"order":3,"isVisible":true,"attribute":"类别Xu"}]},"polygonTool":{"toolName":"polygonTool","result":[{"id":"uxmgIMYH","valid":true,"isVisible":true,"textAttribute":"","pointList":[{"x":1093.9372549019606,"y":301.68627450980387},{"x":890.7607843137254,"y":317.69411764705876},{"x":1037.2941176470588,"y":461.76470588235287},{"x":1111.1764705882351,"y":435.90588235294115},{"x":1159.1999999999998,"y":389.11372549019603},{"x":1214.6117647058823,"y":362.0235294117647},{"x":1087.7803921568627,"y":479.0039215686274},{"x":1075.4666666666665,"y":512.2509803921567},{"x":1262.635294117647,"y":341.09019607843135},{"x":1260.1725490196077,"y":322.6196078431372},{"x":1228.156862745098,"y":286.9098039215686},{"x":1170.2823529411764,"y":274.5960784313725},{"x":1122.2588235294115,"y":307.84313725490193},{"x":1086.549019607843,"y":304.1490196078431}],"attribute":"类别Bd","order":4},{"id":"nc9q92Tw","valid":true,"isVisible":true,"textAttribute":"","pointList":[{"x":1189.98431372549,"y":561.5058823529411},{"x":972.0313725490195,"y":624.3058823529411},{"x":1096.3999999999999,"y":736.3607843137254},{"x":1332.8235294117646,"y":753.5999999999999},{"x":1451.0352941176468,"y":730.2039215686274},{"x":1435.027450980392,"y":539.3411764705882},{"x":1368.533333333333,"y":549.192156862745},{"x":1299.5764705882352,"y":646.470588235294},{"x":1262.635294117647,"y":572.5882352941176},{"x":1188.7529411764704,"y":570.1254901960783},{"x":1173.976470588235,"y":593.521568627451},{"x":1165.356862745098,"y":554.1176470588234}],"attribute":"类别Bd","order":5},{"id":"tA8FtIMv","valid":true,"isVisible":true,"textAttribute":"","pointList":[{"x":900.6117647058823,"y":448.2196078431372},{"x":693.7411764705881,"y":550.4235294117647},{"x":964.6431372549018,"y":579.9764705882352},{"x":1047.1450980392156,"y":572.5882352941176},{"x":987.5517071144436,"y":412.8583022494455},{"x":937.5529411764704,"y":440.83137254901953},{"x":863.670588235294,"y":448.2196078431372},{"x":808.2588235294116,"y":449.4509803921568},{"x":802.1019607843136,"y":422.36078431372545},{"x":861.2078431372548,"y":467.92156862745094}],"attribute":"类别pT","order":6},{"id":"zSYvCgdK","valid":true,"isVisible":true,"textAttribute":"","pointList":[{"x":775.0117647058822,"y":168.69803921568626},{"x":602.6196078431371,"y":176.0862745098039},{"x":628.4784313725489,"y":203.17647058823528},{"x":846.4313725490196,"y":256.1254901960784},{"x":940.0156862745097,"y":242.5803921568627},{"x":951.0980392156862,"y":204.40784313725487},{"x":940.0156862745097,"y":161.3098039215686},{"x":861.2078431372548,"y":146.5333333333333},{"x":803.3333333333333,"y":151.45882352941175},{"x":739.3019607843137,"y":168.69803921568626},{"x":738.070588235294,"y":163.77254901960782}],"attribute":"类别pT","order":7}]},"pointTool":{"toolName":"pointTool","result":[{"x":392.0549019607843,"y":217.95294117647057,"isVisible":true,"attribute":"类别9h","valid":true,"id":"ULJHmcz7","textAttribute":"","order":8},{"x":435.15294117647056,"y":312.7686274509804,"isVisible":true,"attribute":"类别9h","valid":true,"id":"GYftCwTG","textAttribute":"","order":9},{"x":337.87450980392157,"y":336.1647058823529,"isVisible":true,"attribute":"类别9h","valid":true,"id":"rnOG9Yr3","textAttribute":"","order":10},{"x":315.7098039215686,"y":312.7686274509804,"isVisible":true,"attribute":"类别9h","valid":true,"id":"wRffbFLa","textAttribute":"","order":11},{"x":367.42745098039217,"y":439.59999999999997,"isVisible":true,"attribute":"类别9h","valid":true,"id":"jBfBCSjk","textAttribute":"","order":12},{"x":364.9647058823529,"y":486.3921568627451,"isVisible":true,"attribute":"类别9h","valid":true,"id":"h0ACdbKR","textAttribute":"","order":13},{"x":344.0313725490196,"y":506.0941176470588,"isVisible":true,"attribute":"类别9h","valid":true,"id":"psMufn2T","textAttribute":"","order":14},{"x":414.2196078431372,"y":543.035294117647,"isVisible":true,"attribute":"类别9h","valid":true,"id":"6jcVmZWT","textAttribute":"","order":15},{"x":495.4901960784314,"y":451.91372549019604,"isVisible":true,"attribute":"类别9h","valid":true,"id":"rg0fpyhk","textAttribute":"","order":16},{"x":372.35294117647055,"y":300.4549019607843,"isVisible":true,"attribute":"类别9h","valid":true,"id":"637eNXHj","textAttribute":"","order":17}]},"rectTool":{"toolName":"rectTool","result":[{"x":171.1121825637443,"y":538.3440516234033,"width":177.12323339056883,"height":268.6369039756961,"attribute":"无标签","valid":true,"isVisible":true,"id":"YCjfOE5L","textAttribute":"","order":18},{"x":457.4614098784972,"y":792.2206861498853,"width":56.089023907013456,"height":159.41091005151193,"attribute":"无标签","valid":true,"isVisible":true,"id":"P1kYLEJ3","textAttribute":"","order":19}]},"tagTool":{"toolName":"tagTool","result":[{"sourceID":"","id":"Fnw56TRm","result":{"class1":"option1","class2":"aoption1"}}]},"textTool":{"toolName":"textTool","result":[{"id":"R1dDGDtP","sourceID":"","value":{"描述的关键":"发广告"}},{"id":"j5MHFtwr","sourceID":"","value":{"描述的关键1":"广告"}}]}}):JSON.stringify([])
    }));
    setFileList(fList);
  }, []);

  const goBack = (data: any) => {
  };
  return (
    <div className='annotationBox'>
      {fileList && fileList.length > 0 && tools && tools.length > 0 && (
        <Annotation
          attribute={attribute}
          tagList={tagList}
          fileList={fileList}
          textConfig={textConfig}
          goBack={goBack}
          tools={tools}
          leftSiderContent={leftSiderContent}
          topActionContent={topActionContent()}
        />
      )}
    </div>
  );
};

export default AnnotationPage;
