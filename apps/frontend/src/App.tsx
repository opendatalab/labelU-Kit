import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { App as AntApp, ConfigProvider } from 'antd';
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import intl from 'react-intl-universal';

import enUS1 from './locales/en-US';
import zhCN1 from './locales/zh-CN';
import { localeConfig } from './locales';
import RouterContainer from './components/RouterContainer';
import themeToken from './styles/theme.json';
import StaticAnt from './StaticAnt';
import routes from './routes';
import * as storage from './utils/storage';
import { QueryProvider } from './api/queryClient';

const App: React.FC = () => {
  // @ts-ignore
  const locale = storage.get('locale') || 'zh_CN';
  /**
   * handler function that passes locale
   * information to ConfigProvider for
   * setting language across text components
   */
  const getAntdLocale = () => {
    if (locale === 'en_US') {
      return enUS;
    } else if (locale === 'zh_CN') {
      return zhCN;
    }
  };

  useEffect(() => {
    if (navigator.language.indexOf('zh-CN') > -1) {
      intl.init({
        currentLocale: 'zh-CN',
        locales: {
          'en-US': enUS1,
          'zh-CN': zhCN1,
        },
      });
    } else {
      intl.init({
        currentLocale: 'en-US',
        locales: {
          'en-US': enUS1,
          'zh-CN': zhCN1,
        },
      });
    }
  }, []);

  return (
    <ConfigProvider locale={getAntdLocale()} componentSize="middle" theme={{ token: themeToken.token }}>
      <AntApp>
        <StaticAnt />
        {/* @ts-ignore */}
        <IntlProvider locale={locale.split('_')[0]} messages={localeConfig[locale]}>
          <QueryProvider>
            <RouterContainer routes={routes} />
          </QueryProvider>
        </IntlProvider>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
