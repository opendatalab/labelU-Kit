import { i18n } from '@label-u/utils';
import React from 'react';

import AnnotationView from '@/components/AnnotationView';

import App from './AppNew';
import './index.scss';

export type { StepConfig, StepConfigState, BasicConfig, TextConfig, FileInfo } from '@/interface/toolConfig';

export type { AppProps } from '@/AppNew';

export { default as StepUtils } from '@/utils/StepUtils';

export default React.forwardRef(App);

export { AnnotationView, i18n };
