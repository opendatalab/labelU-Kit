import React from 'react';
import sLineASvg from '@/assets/annotation/lineTool/icon_line_a.svg';
import sPointASvg from '@/assets/annotation/pointTool/icon_point_a.svg';
import sIconPolygonPatternASvg from '@/assets/annotation/polygonTool/icon_polygon_a.svg';
import sIconRectPatternSvg from '@/assets/annotation/rectTool/icon_rectPattern_a.svg';

import icon_tag from '@/assets/annotation/icon_tag.svg';
import lineASvg from '@/assets/annotation/lineTool/icon_line.svg';
import pointASvg from '@/assets/annotation/pointTool/icon_point.svg';
import iconPolygonPatternASvg from '@/assets/annotation/polygonTool/icon_polygon.svg';
import iconRectPatternSvg from '@/assets/annotation/rectTool/icon_rectPattern.svg';
import icon_pointCloudSvg from '@/assets/annotation/pointCloudTool/icon_pointCloud.svg';
import icon_pointCloudSvgA from '@/assets/annotation/pointCloudTool/icon_pointCloudA.svg';
import { BasicConfig } from '../../../../types/tool';
import { ChangeSave, ChangeCurrentTool } from '../../../../store/annotation/actionCreators';
import { useDispatch, useSelector } from '@/store/ctx';
import ImageStyle from '../ImageStyle';
import { AppState } from '@/store';
import { Popover } from 'antd';
import { useTranslation } from 'react-i18next';
import { EToolName } from '@/data/enums/ToolType';

interface IProps {
  toolsBasicConfig?: BasicConfig[];
}

export const toolList = [
  {
    toolName: EToolName.PointCloud,
    commonSvg: icon_pointCloudSvg,
    selectedSvg: icon_pointCloudSvgA,
  },
  {
    toolName: EToolName.Rect,
    commonSvg: iconRectPatternSvg,
    selectedSvg: sIconRectPatternSvg,
  },
  // 多边形工具
  {
    toolName: EToolName.Polygon,
    commonSvg: iconPolygonPatternASvg,
    selectedSvg: sIconPolygonPatternASvg,
  },
  {
    toolName: EToolName.Line,
    commonSvg: lineASvg,
    selectedSvg: sLineASvg,
    pattern: EToolName.Line,
  },
  {
    toolName: EToolName.Point,
    commonSvg: pointASvg,
    selectedSvg: sPointASvg,
    pattern: 'drawPoint',
  },
  {
    toolName: EToolName.Tag,
    commonSvg: icon_tag,
    selectedSvg: icon_tag,
    pattern: EToolName.Tag,
  },
];

const notShowIconTool = [EToolName.Tag, EToolName.Text];

const ToolOperation: React.FC<IProps> = (props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const currentToolName = useSelector((state: AppState) => state.annotation.currentToolName);
  const { toolsBasicConfig } = props;
  return (
    <div className='lbc-left-sider'>
      {toolsBasicConfig &&
        toolsBasicConfig.length > 0 &&
        toolsBasicConfig.map((item: BasicConfig) => {
          const renderTool = toolList?.find((tItem) => tItem?.toolName === item.tool);
          if (notShowIconTool.indexOf(item.tool as EToolName) < 0) {
            return (
              <Popover key={item.tool} content={t(item.tool)} trigger='hover'>
                <a
                  onClick={(e) => {
                    // 切换工具保存标注结果
                    dispatch(ChangeSave);
                    // 切换工具更新工具名称
                    dispatch(ChangeCurrentTool(item.tool));
                    e.stopPropagation();
                  }}
                >
                  <img
                    title={item.tool}
                    className='lb-left-item'
                    src={
                      item.tool === currentToolName
                        ? renderTool?.selectedSvg
                        : renderTool?.commonSvg
                    }
                  />
                </a>
              </Popover>
            );
          }
          return <div key={item.tool} />;
        })}
      <ImageStyle />
    </div>
  );
};

export default ToolOperation;
