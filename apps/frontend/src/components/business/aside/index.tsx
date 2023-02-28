import type { FC } from 'react';
import type { TreeProps } from 'antd';
import { Divider, Tree } from 'antd';
import type { DataNode } from 'rc-tree/lib/interface';
import styled from 'styled-components';

export type MySideOption = DataNode;

export interface MyAsideProps extends Omit<TreeProps, 'treeData'> {
  options?: MySideOption[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const AsideWrapper = styled.div`
  padding: 8px;
  background-color: #ffffff;
  margin-right: 8px;
  width: 200px;
  height: 100%;
  display: flex;
  flex-direction: column;
  .header,
  .footer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .ant-tree {
    margin-top: 12px;
    flex: 1;
    .ant-tree-node-content-wrapper {
      line-height: 28px;
    }
  }
`;

const MyAside: FC<MyAsideProps> = (props) => {
  const { options, header, footer, ...rest } = props;
  return (
    // eslint-disable-next-line react/no-unknown-property
    <AsideWrapper>
      {header && (
        <div className="header">
          {header}
          <Divider />
        </div>
      )}
      <Tree {...rest} treeData={options} blockNode />
      {footer && (
        <div className="footer">
          <Divider />
          {footer}
        </div>
      )}
    </AsideWrapper>
  );
};

export default MyAside;
