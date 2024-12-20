import { i18n } from '@labelu/components-react'

import { resources } from './locales'

i18n.addResource('en-US', 'translation', resources['en-US'], true);
i18n.addResource('zh-CN', 'translation', resources['zh-CN'], true);

export * from './ImageAnnotator';
export * from './context';
