import { Tabs } from 'antd';
import classNames from 'classnames';
import React, { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import _, { size } from 'lodash-es';

import ViewContext from '@/view.context';

import { prefix } from '../../../constant';
import AttributeResult from './AttributeResult';
import TagSidebar from './TagSidebar';
import TextToolSidebar from './TextToolSidebar';

const sidebarCls = `${prefix}-sidebar`;
const RightSiderbar = () => {
  const { result, textConfig, tagConfigList, graphicResult } = useContext(ViewContext);
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

  const textTab = useMemo(() => {
    const textResultKeys = result?.textTool ? result?.textTool.result : [];

    return (
      <div className="rightTab">
        <p>文本描述</p>
        <span
          className={classNames({
            innerWord: true,
            finish: textResultKeys && textResultKeys.length > 0 && textResultKeys.length === size(textConfig),
          })}
        >
          {textResultKeys && textResultKeys.length > 0 && textResultKeys.length === size(textConfig)
            ? '已完成'
            : '未完成'}
        </span>
      </div>
    );
  }, [result?.textTool, textConfig]);

  const tagTab = useMemo(() => {
    const tagResultKeys = Object.keys(_.get(result, 'tagTool.result[0].result', {}));

    return (
      <div className="rightTab">
        <p>分类</p>
        <span
          className={classNames({
            innerWord: true,
            finish: tagResultKeys && tagResultKeys.length > 0 && tagResultKeys.length === size(tagConfigList),
          })}
        >
          {tagResultKeys && tagResultKeys.length > 0 && tagResultKeys.length === size(tagConfigList)
            ? '已完成'
            : '未完成'}
        </span>
      </div>
    );
  }, [result, tagConfigList]);

  const attributeTab = useMemo(() => {
    const count = graphicResult?.reduce((acc, cur) => {
      return acc + cur.result.length;
    }, 0);

    return (
      <div className="rightTab">
        <p>标注结果</p>
        <span className="innerWord">{count}件</span>
      </div>
    );
  }, [graphicResult]);

  return (
    <div className={`${sidebarCls}`} ref={sideRef}>
      <Tabs defaultActiveKey="1">
        {tagConfigList && tagConfigList.length > 0 && (
          <Tabs.TabPane forceRender tab={tagTab} key="1">
            <div className={`${sidebarCls}`}>
              <TagSidebar />
            </div>
          </Tabs.TabPane>
        )}
        {graphicResult && graphicResult.length > 0 && (
          <Tabs.TabPane forceRender tab={attributeTab} key="2">
            <AttributeResult />
          </Tabs.TabPane>
        )}
        {textConfig && textConfig.length > 0 && (
          <Tabs.TabPane forceRender tab={textTab} key="3">
            <div className={`${sidebarCls}`}>
              <TextToolSidebar />
            </div>
          </Tabs.TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default RightSiderbar;
