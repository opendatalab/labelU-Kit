import React from 'react';
import intl from 'react-intl-universal';

import currentStyles from './index.module.scss';
import enUS1 from '../../locales/en-US';
import zhCN1 from '../../locales/zh-CN';
const LogoTitle = () => {
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
  return (
    <div className={currentStyles.outerFrame}>
      <div className={currentStyles.logo} />
      <div className={currentStyles.logoText}>
        {/*<div>Uniform, Unlimited, Universal and Unbelievable</div>*/}
        <div>{intl.get('loginTitle1')}</div>
        <div>{intl.get('loginTitle2')}</div>
        {/*<div>Annotation Toolbox</div>*/}
      </div>
    </div>
  );
};
export default LogoTitle;
