import type { DrawerProps } from 'antd';
import { Button, Drawer } from 'antd';
import { isEmpty } from 'lodash/fp';
import { useMemo } from 'react';
import styled from 'styled-components';
import Icon from '@ant-design/icons';

import { ReactComponent as AddCategoryIcon } from '@/assets/svg/add-category.svg';
import { ReactComponent as AddTextIcon } from '@/assets/svg/add-text.svg';

export interface AttributeConfigurationProps {
  visible: boolean;
  value: any;
  onClose: () => void;
}

const StyledDrawer = styled<React.FC<DrawerProps>>(Drawer)`
  .addition {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .addition-button {
    display: flex;
    padding: 1.5rem 3rem;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    cursor: pointer;
    background-color: #fff;
    flex-direction: column;
    border-style: dashed;
    border-width: 1px;
    background-color: var(--color-primary-bg);
    border-color: var(--color-primary-border);
    transition: all var(--motion-duration-fast);

    &:hover {
      background-color: var(--color-primary-bg-hover);
      border-color: var(--color-primary-border-hover);
    }

    &:active {
      border-color: var(--color-primary-active);
    }
  }

  .new-category-attr {
    margin-right: 1.5rem;
  }

  .icon {
    font-size: 3rem;
  }

  .title {
    margin: 1rem 0 0.5rem;
  }

  sub {
    color: var(--color-text-secondary);
  }
`;

export default function AttributeConfiguration({ onClose, visible, value }: AttributeConfigurationProps) {
  const emptyPlaceholder = useMemo(
    () => (
      <div className="addition">
        <button className="addition-button new-category-attr">
          <Icon className="icon" component={AddCategoryIcon} />
          <span className="title">新建分类属性</span>
          <sub>选择题形式</sub>
        </button>

        <button className="addition-button new-text-attr">
          <Icon className="icon" component={AddTextIcon} />
          <span className="title">新建文本属性</span>
          <sub>填空题形式</sub>
        </button>
      </div>
    ),
    [],
  );
  const footer = useMemo(
    () => (
      <div>
        <Button type="primary">保存</Button>
        <Button onClick={onClose}>取消</Button>
      </div>
    ),
    [onClose],
  );
  return (
    <StyledDrawer
      open={visible}
      title="属性配置"
      width={800}
      onClose={onClose}
      footer={footer}
      bodyStyle={{ display: 'flex', justifyContent: 'center' }}
    >
      {isEmpty(value) ? emptyPlaceholder : null}
    </StyledDrawer>
  );
}
