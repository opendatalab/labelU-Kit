import { i18n } from '@label-u/utils';

import AnnotationView from '@/components/AnnotationView';

import App from './App';
import './index.scss';

export type { BasicConfig, TextConfig, FileInfo } from '@/interface/toolConfig';

export type { AppProps } from '@/App';

export { default as StepUtils } from '@/utils/StepUtils';

export default App;

export { AnnotationView, i18n };
