import { Tabs } from 'antd';
import classNames from 'classnames';
import React, { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import _, { size } from 'lodash-es';
import type { EToolName } from '@label-u/annotation';

import ViewContext from '@/view.context';

import { prefix, labelTool } from '../../../constant';
import AttributeResult from './AttributeResult';
import TagSidebar from './TagSidebar';
import TextToolSidebar from './TextToolSidebar';

const sidebarCls = `${prefix}-sidebar`;
const RightSiderbar = () => {
  const { result, textConfig, tagConfigList, graphicResult, config } = useContext(ViewContext);
  const sideRef = useRef<HTMLDivElement>(null);

  // 将右侧属性栏高度设置为剩余高度
  useLayoutEffect(() => {
    if (!sideRef.current) {
      return;
    }

    const contentElem = sideRef.current.querySelector('.ant-tabs-content') as HTMLElement;

    if (!contentElem) {
      return;
    }

    const rect = contentElem.getBoundingClientRect();
    const attributeWrapperHeight = window.innerHeight - rect.top;
    contentElem.style.height = `${attributeWrapperHeight}px`;
  }, []);

  const globalTab = useMemo(() => {
    const tagResultKeys = Object.keys(_.get(result, 'tagTool.result[0].result', {}));
    const textResultKeys = result?.textTool ? result?.textTool.result : [];
    const isFinished =
      textResultKeys &&
      textResultKeys.length > 0 &&
      textResultKeys.length === size(textConfig) &&
      tagResultKeys &&
      tagResultKeys.length > 0 &&
      tagResultKeys.length === size(tagConfigList);

    return (
      <div className="rightTab">
        <p>全局</p>
        <span
          className={classNames({
            innerWord: true,
            finish: isFinished,
          })}
        >
          {isFinished ? '已完成' : '未完成'}
        </span>
      </div>
    );
  }, [result, tagConfigList, textConfig]);

  const labelToolLen = useMemo(
    () => config?.tools?.filter((tool) => labelTool.includes(tool.tool as EToolName)).length,
    [config?.tools],
  );
  const attributeTab = useMemo(() => {
    const count = graphicResult?.reduce((acc, cur) => {
      return acc + cur.result.length;
    }, 0);

    return (
      <div className="rightTab">
        <p>标记</p>
        <span className="innerWord">{count}件</span>
      </div>
    );
  }, [graphicResult]);

  return (
    <div className={`${sidebarCls}`} ref={sideRef}>
      <Tabs defaultActiveKey="1">
        {((tagConfigList && tagConfigList.length > 0) || (textConfig && textConfig.length > 0)) && (
          <Tabs.TabPane forceRender tab={globalTab} key="1">
            <div className={`${sidebarCls}`}>
              <TagSidebar />
              <TextToolSidebar />
            </div>
          </Tabs.TabPane>
        )}

        {labelToolLen && (
          <Tabs.TabPane forceRender tab={attributeTab} key="2">
            <AttributeResult />
          </Tabs.TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default RightSiderbar;
