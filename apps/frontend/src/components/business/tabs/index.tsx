import type { FC } from 'react';
import type { TabPaneProps, TabsProps } from 'antd';
import { Tabs } from 'antd';
import styled from 'styled-components';

const { TabPane } = Tabs;

export interface MyTabsOption extends Omit<TabPaneProps, 'tab' | 'key'> {
  label: string;
  value: string | number;
}

export interface MyTabsProps extends TabsProps {
  options: MyTabsOption[];
}

const TabsWrapper = styled(Tabs)`
  background-color: #fff;
  padding: 0 20px;
  box-shadow: 0 10px 10px -10px rgb(0 0 0 / 10%);
  height: 62px;
  .ant-tabs-nav {
    margin: 0;
  }
  .ant-tabs-tab {
    padding: 20px 0;
    & + .ant-tabs-tab {
      margin: 0 0 0 42px;
    }
  }
`;

const BaseTabs: FC<MyTabsProps> = (props) => {
  const { options, children, ...rest } = props;
  return (
    <TabsWrapper {...rest}>
      {options ? options.map((option) => <TabPane {...option} tab={option.label} key={option.value} />) : children}
    </TabsWrapper>
  );
};

const MyTabs = Object.assign(BaseTabs, Tabs);

export default MyTabs;
