import App,{ AppProps } from './App';
import AnnotationView from '@/components/AnnotationView';
import { i18n } from '@label-u/utils';
import React, { useImperativeHandle, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { AnyAction } from 'redux';
import configureStore from './configureStore';
import { ChangeSave, PageBackward, PageForward, PageJump } from './store/annotation/actionCreators';
import { ToolInstance } from './store/annotation/types';
import { VideoTagTool } from '@/components/videoPlayer/TagToolInstanceAdaptorI18nProvider';

export const store = configureStore();

const OutputApp = (props: AppProps, ref: any) => {
  const [toolInstance, setToolInstance] = useState<ToolInstance>();
  // 暴露给 ref 的一些方法
  useImperativeHandle(
    ref,
    () => {
      return {
        toolInstance,
        pageBackwardActions: () => store.dispatch(PageBackward() as unknown as AnyAction),
        pageForwardActions: () => store.dispatch(PageForward() as unknown as AnyAction),
        pageJump: (page: string) => {
          const imgIndex = ~~page - 1;
          store.dispatch(PageJump(imgIndex) as unknown as AnyAction);
        },
        saveData: () => {
          store.dispatch(ChangeSave as unknown as AnyAction);
        },
        getResult:()=>{
          // @ts-ignore
          return store.getState()?.annotation.imgList;
        }
      };
    },
    [toolInstance],
  );

  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <App {...props} setToolInstance={setToolInstance} />
      </I18nextProvider>
    </Provider>
  );
};

export type { StepConfig, StepConfigState, BasicConfig,TextConfig,FileInfo } from '@/interface/toolConfig';

export type { AppProps } from '@/App';

export { default as StepUtils } from '@/utils/StepUtils';

export default React.forwardRef(OutputApp);

export { AnnotationView, i18n, VideoTagTool };
