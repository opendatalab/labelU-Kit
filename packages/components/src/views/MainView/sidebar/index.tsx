import { Collapse, Row } from 'antd/es';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { cTool } from '@label-u/annotation';

import { ReactComponent as IconTag } from '@/assets/annotation/icon_tag.svg';
import { ReactComponent as LineASvg } from '@/assets/annotation/lineTool/icon_line.svg';
import { ReactComponent as PointASvg } from '@/assets/annotation/pointTool/icon_point.svg';
import { ReactComponent as IconPolygonPatternASvg } from '@/assets/annotation/polygonTool/icon_polygon.svg';
import { ReactComponent as IconRectPatternSvg } from '@/assets/annotation/rectTool/icon_rectPattern.svg';
import { prefix } from '@/constant';
import { EToolName } from '@/data/enums/ToolType';
import type { AppState } from '@/store';
import type { Sider } from '@/types/main';
import StepUtils from '@/utils/StepUtils';
import MemoToolIcon from '@/components/ToolIcon';

import AnnotationText from './AnnotationText';
import ClearIcon from './ClearIcon';
import GeneralOperation from './GeneralOperation';
import ImgAttributeInfo from './ImgAttributeInfo';
import SwitchAttributeList from './SwitchAttributeList';
import TagSidebar, { expandIconFuc } from './TagSidebar';
import TextToolSidebar from './TextToolSidebar';
import ToolStyle from './ToolStyle';

const { EVideoToolName } = cTool;

const { Panel } = Collapse;
interface IProps {
  toolName?: EToolName;
  sider?: Sider;
}

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
const sidebarCls = `${prefix}-sidebar`;
const Sidebar: React.FC<IProps> = ({ sider }) => {
  const stepInfo = useSelector((state: AppState) =>
    StepUtils.getCurrentStepInfo(state.annotation.step, state.annotation.stepList),
  );
  const toolName = stepInfo?.tool;
  const { t } = useTranslation();

  if (!toolName) {
    return null;
  }

  const renderTool = toolList?.find((item) => item?.toolName === toolName);

  /**
   * 样式面板, 包含透明度、线框、颜色
   * @param key 虚拟dom的key
   */
  const renderStylePanel = (key: string) => {
    const ToolStyleComponent = <ToolStyle />;
    return (
      <Panel header={t('Style')} className="panel" key={key}>
        {ToolStyleComponent}
      </Panel>
    );
  };

  const toolIcon = (
    <div className={`${sidebarCls}__level`}>
      <Row className={`${sidebarCls}__toolsOption`}>
        {renderTool && (
          <MemoToolIcon className={`${sidebarCls}__singleTool`} icon={renderTool.Icon} style={{ color: '#1B67FF' }} />
        )}
      </Row>
    </div>
  );

  const attributeList = <SwitchAttributeList />;

  const annotationText = <AnnotationText />;

  const toolStyle = (
    <Collapse
      defaultActiveKey={['1', 'imgAttribute']}
      bordered={false}
      expandIconPosition="right"
      className={`${sidebarCls}__content`}
      expandIcon={expandIconFuc}
    >
      {renderStylePanel('1')}
    </Collapse>
  );

  const imageAttributeInfo = (
    <Collapse
      defaultActiveKey={['1', 'imgAttribute']}
      bordered={false}
      expandIconPosition="right"
      className={`${sidebarCls}__content`}
      expandIcon={expandIconFuc}
    >
      <Panel
        header={
          <div>
            {t('Adjust')}

            <ClearIcon />
          </div>
        }
        className="panel"
        key="imgAttribute"
      >
        <ImgAttributeInfo />
      </Panel>
    </Collapse>
  );

  const operation = <GeneralOperation />;

  const tagToolSideBar = <TagSidebar />;

  const textToolSideBar = <TextToolSidebar />;

  const horizontal = <div className={`${sidebarCls}__horizontal`} />;
  if (sider) {
    if (typeof sider === 'function') {
      return (
        <div className={`${sidebarCls}`}>
          {sider({
            toolIcon,
            attributeList,
            annotationText,
            toolStyle,
            imageAttributeInfo,
            operation,
            tagToolSideBar,
            textToolSideBar,
            horizontal,
          })}
        </div>
      );
    } else {
      return sider;
    }
  }

  if (
    ([EToolName.Rect, EToolName.Point, EToolName.Line, EToolName.Rect, EToolName.Polygon] as string[]).includes(
      toolName,
    )
  ) {
    return (
      <div className={`${sidebarCls}`}>
        {toolIcon}
        {horizontal}
        {attributeList}
        {annotationText}
        {horizontal}
        <div className={`${sidebarCls}__content`}>
          {toolStyle}
          {imageAttributeInfo}
        </div>
        {operation}
      </div>
    );
  }

  if (toolName === EToolName.Tag) {
    return (
      <div className={`${sidebarCls}`}>
        <TagSidebar />
      </div>
    );
  }

  if (toolName === EVideoToolName.VideoTagTool) {
    return (
      <div className={`${sidebarCls}`}>
        <div className={`${sidebarCls}__content`}>
          <TagSidebar />
        </div>
        {operation}
      </div>
    );
  }

  if (toolName === EToolName.Text) {
    return (
      <div className={`${sidebarCls}`}>
        <TextToolSidebar />
      </div>
    );
  }

  return null;
};

export default Sidebar;
