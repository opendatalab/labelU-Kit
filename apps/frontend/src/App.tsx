import { App as AntApp, ConfigProvider } from 'antd';
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import { I18nProvider, useTranslation } from '@labelu/i18n';

import RouterContainer from './components/RouterContainer';
import themeToken from './styles/theme.json';
import StaticAnt from './StaticAnt';
import routes from './routes';
import * as storage from './utils/storage';
import { QueryProvider } from './api/queryClient';
import GlobalStyle from './styles/GlobalStyle';

const App: React.FC = () => {
  const { i18n } = useTranslation();
  const locale = storage.get('locale') || 'zh_CN';
  const getAntdLocale = () => {
    if (locale === 'en_US' || ['en', 'en_US', 'en-US'].includes(i18n.language)) {
      return enUS;
    } else if (locale === 'zh_CN' || ['zh', 'zh_CN', 'zh-CN'].includes(i18n.language)) {
      return zhCN;
    }
  };

  return (
    <ConfigProvider locale={getAntdLocale()} componentSize="middle" theme={{ token: themeToken.token }}>
      <I18nProvider>
        <AntApp>
          <StaticAnt />
          <GlobalStyle />
          {/* @ts-ignore */}
          <QueryProvider>
            <RouterContainer routes={routes} />
          </QueryProvider>
        </AntApp>
      </I18nProvider>
    </ConfigProvider>
  );
};

export default App;
