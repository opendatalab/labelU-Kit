
import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import { resources } from '../locales';

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
export * from 'react-i18next'
