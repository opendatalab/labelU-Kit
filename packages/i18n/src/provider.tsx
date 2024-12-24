import React, { useCallback, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';

import { merge } from './utils';
import { useLocalStorage } from './useLocalStorage';
import { i18n } from './i18n';
import { resources } from './locales';
const LANG_CHANGE_EVENT = 'labelu-lang-change';

interface I18nProviderProps {
  locales?: Record<string, Record<string, unknown> & { translation: Record<string, unknown> }>;
  locale?: string;
  children: React.ReactElement;
}

export function I18nProvider(props: I18nProviderProps) {
  const { locales, children, locale } = props;
  const [, setLang] = useLocalStorage('lang', () => {
    return i18n.language;
  });

  useEffect(() => {
    if (locale) {
      i18n.changeLanguage(locale);
      setLang(locale);
    }
  }, [locale, setLang]);

  const handleLangChange = useCallback(
    (e: any) => {
      i18n.changeLanguage(e.detail);
      setLang(e.detail);
    },
    [setLang],
  );

  useEffect(() => {
    document.addEventListener(LANG_CHANGE_EVENT, handleLangChange);

    return () => {
      document.removeEventListener(LANG_CHANGE_EVENT, handleLangChange);
    };
  }, [handleLangChange]);

  useEffect(() => {
    setLang(i18n.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  useEffect(() => {
    if (locales) {
      Object.keys(locales || {}).forEach((lang) => {
        i18n.addResourceBundle(lang, 'translation', merge({}, resources[lang], locales[lang]), true);
      });
    }
  }, [locales]);
  return (
    <>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </>
  );
}

/** 用于外部改变语言 */
export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('lang', lang);
  document.dispatchEvent(new CustomEvent(LANG_CHANGE_EVENT, { detail: lang }));
};
