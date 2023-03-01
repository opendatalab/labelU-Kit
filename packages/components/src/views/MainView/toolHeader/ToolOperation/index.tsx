import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Popover } from 'antd';
import { useTranslation } from 'react-i18next';

import { ReactComponent as IconTag } from '@/assets/annotation/icon_tag.svg';
import { ReactComponent as LineASvg } from '@/assets/annotation/lineTool/icon_line.svg';
import { ReactComponent as PointASvg } from '@/assets/annotation/pointTool/icon_point.svg';
import { ReactComponent as IconPolygonPatternASvg } from '@/assets/annotation/polygonTool/icon_polygon.svg';
import { ReactComponent as IconRectPatternSvg } from '@/assets/annotation/rectTool/icon_rectPattern.svg';
import { ReactComponent as IconCuboidSvg } from '@/assets/annotation/cuboidTool/icon_cuboid_basic.svg';
import type { AppState } from '@/store';
import { EToolName } from '@/data/enums/ToolType';
import ToolIcon from '@/components/ToolIcon';

import type { BasicConfig } from '../../../../types/tool';
import { ChangeSave, ChangeCurrentTool } from '../../../../store/annotation/actionCreators';
import ImageStyle from '../ImageStyle';

interface IProps {
  toolsBasicConfig?: BasicConfig[];
}

export const toolList = [
  {
    toolName: EToolName.Rect,
    Icon: IconRectPatternSvg,
  },
  {
    toolName: EToolName.Cuboid,
    Icon: IconCuboidSvg,
  },
  {
    toolName: EToolName.Polygon,
    Icon: IconPolygonPatternASvg,
  },
  {
    toolName: EToolName.Line,
    Icon: LineASvg,
    pattern: EToolName.Line,
  },
  {
    toolName: EToolName.Point,
    Icon: PointASvg,
    pattern: 'drawPoint',
  },
  {
    toolName: EToolName.Tag,
    Icon: IconTag,
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
    <div className="lbc-left-sider">
      {toolsBasicConfig &&
        toolsBasicConfig.length > 0 &&
        toolsBasicConfig.map((item: BasicConfig) => {
          const renderTool = toolList?.find((tItem) => tItem?.toolName === item.tool);
          if (notShowIconTool.indexOf(item.tool as EToolName) < 0) {
            return (
              <Popover key={item.tool} content={t(item.tool)} trigger="hover">
                <a
                  onClick={(e) => {
                    // 切换工具保存标注结果
                    dispatch(ChangeSave);
                    // 切换工具更新工具名称
                    dispatch(ChangeCurrentTool(item.tool));
                    e.stopPropagation();
                  }}
                >
                  <ToolIcon
                    className="lb-left-item"
                    icon={renderTool?.Icon}
                    style={{ color: currentToolName === item.tool ? '#1B67FF' : '#666' }}
                  />
                </a>
              </Popover>
            );
          }
        })}
      <ImageStyle />
    </div>
  );
};

export default ToolOperation;
