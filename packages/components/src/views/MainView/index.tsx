import { Layout } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

import { ViewportProvider } from '@/components/customResizeHook';
import { prefix } from '@/constant';

import AnnotationOperation from './annotationOperation';
import AttributeOperation from './attributeOperation';
import LeftSider from './leftSiderBar';
import RightSiderbar from './rightSiderBar';
import ToolFooter from './toolFooter';
import ToolHeader from './toolHeader';
const { Sider, Content } = Layout;

const layoutCls = `${prefix}-layout`;

const ImageAnnotate = () => {
  return (
    <>
      <AnnotationOperation />
      <ToolFooter />
    </>
  );
};

const MainView: React.FC<any> = (props) => {
  const [, setBoxWidth] = useState<number>();
  useEffect(() => {
    const boxParent = document.getElementById('annotation-content-area-to-get-box')?.parentNode as HTMLElement;
    setBoxWidth(boxParent.clientWidth);
  }, []);

  // 取消加载时loading
  return (
    <ViewportProvider>
      <Layout
        className={classNames({
          'lab-layout': true,
        })}
        style={props.style?.layout}
      >
        <header className={`${layoutCls}__header`} style={props.style?.header}>
          <ToolHeader />
        </header>
        <AttributeOperation />
        <Layout style={{ flexDirection: 'row' }}>
          {<LeftSider {...props} />}
          <Content className={`${layoutCls}__content`}>
            <ImageAnnotate />
          </Content>
          <Sider className={`${layoutCls}__side`} width="auto" style={props.style?.sider ?? {}}>
            <RightSiderbar />
          </Sider>
        </Layout>
      </Layout>
    </ViewportProvider>
  );
};
export default MainView;
