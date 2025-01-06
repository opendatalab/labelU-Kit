import styled, { css } from 'styled-components';
import type { CollapseProps } from 'rc-collapse';
import Collapse from 'rc-collapse';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@labelu/i18n';

import { ReactComponent as ArrowDown } from './arrow-down.svg';
import { ReactComponent as ArrowRight } from './arrow-right.svg';
import { HotkeyTable } from '../HotkeyTable';

const Wrapper = styled.div`
  display: flex;
  padding: 0.75rem;
`;

const prefixCls = 'labelu-hotkey-panel';

const commonCss = css`
  width: 0;
  height: 0;
  font-size: 0;
  line-height: 0;
`;

const rightCss = (width: number, height: number, color: string) => css`
  border-top: ${width}px solid transparent;
  border-bottom: ${width}px solid transparent;
  border-left: ${height}px solid ${color};
`;

const bottomCss = (width: number, height: number, color: string) => css`
  border-left: ${width}px solid transparent;
  border-right: ${width}px solid transparent;
  border-top: ${height}px solid ${color};
`;

// @ts-ignore
const CollapseWrapper: React.ForwardRefExoticComponent<CollapseProps> = styled(Collapse)`
  --text-color: #666;
  --border-style: 1px solid #d9d9d9;
  border-radius: 3px;
  font-size: 14px;

  .${prefixCls}-item {
    &:first-child {
      border-top: none;
    }

    .${prefixCls}-header {
      display: flex;
      align-items: center;
      cursor: pointer;
      margin-bottom: 0.25rem;

      .arrow {
        ${commonCss}
        ${rightCss(5, 6, '#666')};
        display: inline-block;
        content: ' ';

        vertical-align: middle;
        margin-right: 8px;
      }

      .${prefixCls}-extra {
        margin: 0 16px 0 auto;
      }
    }
    .${prefixCls}-header-collapsible-only {
      cursor: default;
      .${prefixCls}-header-text {
        cursor: pointer;
      }
      .${prefixCls}-expand-icon {
        cursor: pointer;
      }
    }
    .${prefixCls}-icon-collapsible-only {
      cursor: default;
      .${prefixCls}-expand-icon {
        cursor: pointer;
      }
    }

    .${prefixCls}-header-text {
      flex-grow: 1;
    }
  }

  .${prefixCls}-item-disabled .${prefixCls}-header {
    cursor: not-allowed;
    color: #999;
    background-color: #f3f3f3;
  }

  .${prefixCls}-content {
    overflow: hidden;

    .${prefixCls}-box {
      margin-top: 16px;
      margin-bottom: 16px;
    }

    &-hidden {
      display: none;
    }
  }

  .${prefixCls}-item-active {
    .${prefixCls}-header {
      .arrow {
        position: relative;
        top: 2px;

        ${bottomCss(5, 6, '#666')}

        margin-right: 6px;
      }
    }
  }
`;

const Left = styled.div`
  min-width: 8rem;
  display: flex;
  flex-direction: column;
  background-color: #fbfbfb;
  border-radius: 3px;
  gap: 0.25rem;
  padding: 0.625rem 0.5rem;
`;

const MenuWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Right = styled.div`
  flex: 1;
  margin-left: 3rem;
`;

const MenuItem = styled.div<{ active?: boolean }>`
  position: relative;
  height: 32px;
  line-height: 32px;
  padding-left: 24px;
  padding-right: 24px;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    font-size: 1rem;
    color: #999;
  }

  ${({ active }) =>
    active
      ? css`
          color: var(--color-primary);
          background-color: rgb(230, 244, 255);

          &:before {
            position: absolute;
            display: block;
            width: 3px;
            border-radius: 0 var(--border-radius) var(--border-radius) 0;
            height: 1rem;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            content: ' ';
            background-color: var(--color-primary);
          }
        `
      : css`
          &:hover {
            background-color: rgba(0, 0, 0, 0.06);
          }
        `}
`;

interface Hotkey {
  name: string;
  content: React.ReactNode;
}

interface HotkeyPanelItem {
  key: string;
  label: React.ReactNode;
  hotkeys?: Hotkey[];
  children?: HotkeyPanelItem[];
}

export interface HotkeyPanelProps {
  items: HotkeyPanelItem[];
}

export function HotkeyPanel({ items }: HotkeyPanelProps) {
  const [openKeys, setOpenKeys] = useState<React.Key[]>([]);
  const [activeKey, setActiveKey] = useState<React.Key>(items[0].key);
  const [hotkeys, setHotkeys] = useState<Hotkey[] | undefined>();
  const { t } = useTranslation();

  useEffect(() => {
    setHotkeys(items[0].hotkeys);
  }, [items]);

  const handleMenuClick = (item: HotkeyPanelItem) => {
    setActiveKey(item.key);
    setHotkeys(item.hotkeys);
  };

  const content = useMemo(() => {
    const tableData =
      hotkeys?.map((item) => ({
        name: item.name,
        content: item.content,
      })) ?? [];
    return (
      <HotkeyTable
        columns={[
          {
            title: t('action'),
            key: 'name',
          },
          {
            title: t('hotkey'),
            key: 'content',
          },
        ]}
        data={tableData}
      />
    );
  }, [hotkeys, t]);

  return (
    <Wrapper>
      <Left>
        {items?.map((item) => {
          if (item.children?.length) {
            return (
              <CollapseWrapper
                key={item.key}
                onChange={(key) => setOpenKeys(key as React.Key[])}
                prefixCls={prefixCls}
                expandIcon={() => null}
                items={[
                  {
                    key: item.key,
                    label: (
                      <MenuItem>
                        {item.label} {openKeys.includes(item.key) ? <ArrowDown /> : <ArrowRight />}
                      </MenuItem>
                    ),
                    children: (
                      <MenuWrapper>
                        {item.children.map((child) => (
                          <MenuItem
                            active={activeKey === child.key}
                            key={child.key}
                            onClick={() => handleMenuClick(child)}
                          >
                            {child.label}
                          </MenuItem>
                        ))}
                      </MenuWrapper>
                    ),
                  },
                ]}
              />
            );
          } else {
            return (
              <MenuItem active={activeKey === item.key} key={item.key} onClick={() => handleMenuClick(item)}>
                {item.label}
              </MenuItem>
            );
          }
        })}
      </Left>
      <Right>{content}</Right>
    </Wrapper>
  );
}
