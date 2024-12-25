import { Button, Dropdown } from 'antd';
import { useTranslation } from '@labelu/i18n';
import { useMemo } from 'react';
import Icon from '@ant-design/icons';

import { ReactComponent as I18nSvg } from '@/assets/svg/i18n.svg';

const langOptions = [
  {
    key: 'zh-CN',
    label: '简体中文',
    value: 'zh-CN',
  },
  {
    key: 'en-US',
    label: 'English',
    value: 'en-US',
  },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const lang = useMemo(() => {
    const _lang = ['zh', 'zh_CN', 'zh-CN'].includes(i18n.language) ? 'zh-CN' : 'en-US';
    return langOptions.find((item) => item.key === _lang)?.label;
  }, [i18n.language]);

  const changeLocale = (e: any) => {
    i18n.changeLanguage(e.key);
    window.location.reload();
  };

  return (
    <Dropdown
      menu={{
        items: langOptions,
        onClick: changeLocale,
      }}
    >
      <Button icon={<Icon component={I18nSvg} />} type="link" style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
        {lang}
      </Button>
    </Dropdown>
  );
}
