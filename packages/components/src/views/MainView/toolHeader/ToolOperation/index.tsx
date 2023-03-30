import React, { useContext } from 'react';
import { Popover } from 'antd';
import { useTranslation } from 'react-i18next';
import { filter, map } from 'lodash-es';

import { ReactComponent as IconTag } from '@/assets/annotation/icon_tag.svg';
import { ReactComponent as LineASvg } from '@/assets/annotation/lineTool/icon_line.svg';
import { ReactComponent as PointASvg } from '@/assets/annotation/pointTool/icon_point.svg';
import { ReactComponent as IconPolygonPatternASvg } from '@/assets/annotation/polygonTool/icon_polygon.svg';
import { ReactComponent as IconRectPatternSvg } from '@/assets/annotation/rectTool/icon_rectPattern.svg';
import { EToolName } from '@/data/enums/ToolType';
import ToolIcon from '@/components/ToolIcon';
import ViewContext from '@/view.context';

import ImageStyle from '../ImageStyle';

export const toolList = [
  {
    toolName: EToolName.Rect,
    Icon: IconRectPatternSvg,
  },
  // 多边形工具
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

const ToolOperation = () => {
  const { config, currentToolName, setToolName } = useContext(ViewContext);
  const { t } = useTranslation();
  const tools = config?.tools;

  const toolNodes = map(
    filter(tools, (item) => !notShowIconTool.includes(item.tool)),
    (toolItem) => {
      const renderTool = toolList?.find((tItem) => tItem?.toolName === toolItem.tool);
      return (
        <Popover key={toolItem.tool} content={t(toolItem.tool)}>
          <a
            onClick={(e) => {
              setToolName(toolItem.tool);
              e.stopPropagation();
            }}
          >
            <ToolIcon
              className="lb-left-item"
              icon={renderTool?.Icon}
              style={{ color: currentToolName === toolItem.tool ? 'var(--color-primary)' : '#666' }}
            />
          </a>
        </Popover>
      );
    },
  );
  return (
    <div className="lbc-left-sider">
      {toolNodes}
      <ImageStyle />
    </div>
  );
};

export default ToolOperation;
