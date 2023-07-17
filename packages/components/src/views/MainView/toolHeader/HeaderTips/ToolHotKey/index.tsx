import { Menu, Popover, Row } from 'antd/es';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { createGlobalStyle } from 'styled-components';

interface IProps {
  style?: any;
  title?: React.ReactElement<any>;
  toolName?: string;
}

const GlobalStyle = createGlobalStyle`
  .tool-hotkeys-popover {

    .ant-popover-inner {
      padding: 1.5rem;
    }
  }
`;

const StyledWrapper = styled.div`
  display: flex;
  align-items: stretch;

  .left {
    width: 8.625rem;
    flex-shrink: 0;
  }

  .ant-menu-item-selected {
    position: relative;
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
  }

  .menu {
    height: 100%;
    padding: 0.625rem 0.5rem;
    background-color: #fbfbfb;
    border-inline-end: 0 !important;
    border-radius: var(--border-radius-lg);

    .ant-menu-sub {
      background-color: transparent !important;
    }
  }

  .right {
    flex-grow: 1;
    margin-left: 3.5rem;
  }

  .title {
    .ant-card-meta-title {
      font-weight: normal;
    }
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ant-card {
    position: relative;
    overflow: hidden;
  }

  .overlay {
    opacity: 0;
    transition: opacity var(--motion-duration-mid);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;

    button {
      margin-top: 4rem;
    }

    &:hover {
      opacity: 1;
    }
  }

  .card {
    .ant-card-cover {
      height: 10rem;
    }
  }

  .hotkeys-table {
    td {
      padding-right: 7.5rem;
      padding-left: 0.75rem;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }
  }
`;

const ToolHotKey: React.FC<IProps> = ({ style }) => {
  const [activeType, setActiveType] = useState<string>('common');
  const { t } = useTranslation();
  const [hotkeyTexts, setHotkeyTexts] = useState<any>({});

  useEffect(() => {
    import('./hotkeys.const').then((res) => {
      setHotkeyTexts(res);
    });
  }, [t]);

  const handleMenuClick = useCallback(({ key }: { key: string }) => {
    setActiveType(key);
  }, []);

  const menuItems = useMemo(() => {
    return [
      {
        key: 'common',
        label: t('Common'),
      },
      {
        key: 'action',
        label: t('Action'),
      },
      {
        key: 'tools',
        label: t('Tools'),
        children: [
          {
            key: 'rect',
            label: t('Rect'),
          },
          {
            key: 'polygon',
            label: t('Polygon'),
          },
          {
            key: 'point',
            label: t('Point'),
          },
          {
            key: 'line',
            label: t('Line'),
          },
        ],
      },
    ];
  }, [t]);

  const currentKeyDescs = (hotkeyTexts as unknown as Record<string, any>)[activeType];

  const content = (
    <StyledWrapper className="wrapper">
      <div className="left">
        <Menu
          className="menu"
          defaultSelectedKeys={[activeType]}
          mode="inline"
          onClick={handleMenuClick}
          defaultOpenKeys={['tools']}
          items={menuItems}
        />
      </div>
      <div className="right">
        <Row gutter={[24, 24]}>
          <table className="hotkeys-table">
            <thead>
              <tr>
                <td>{t('Operation')}</td>
                <td>{t('Shortcut')}</td>
              </tr>
            </thead>
            <tbody>
              {currentKeyDescs?.map((item: any) => {
                return (
                  <tr key={item.action}>
                    <td>{t(item.name)}</td>
                    <td>{item.title}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Row>
      </div>
    </StyledWrapper>
  );
  const containerStyle = style || { width: 100 };

  return (
    <Popover
      placement="topLeft"
      content={content}
      align={{
        offset: [20, 0],
      }}
      overlayClassName="tool-hotkeys-popover"
    >
      <div className="shortCutTitle" style={containerStyle}>
        <a>{t('Hotkeys')}</a>
      </div>
      <GlobalStyle />
    </Popover>
  );
};

export default ToolHotKey;
