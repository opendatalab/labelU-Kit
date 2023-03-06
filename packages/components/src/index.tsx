import { i18n } from '@label-u/utils';
import React, { useImperativeHandle, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import type { AnyAction } from 'redux';

import AnnotationView from '@/components/AnnotationView';
import { VideoTagTool } from '@/components/videoPlayer/TagToolInstanceAdaptorI18nProvider';

import configureStore from './configureStore';
import type { ToolInstance } from './store/annotation/types';
import App from './App';
import type { AppProps } from './App';
import { ChangeSave, PageBackward, PageForward, PageJump } from './store/annotation/actionCreators';
import { toolList } from './views/MainView/toolHeader/ToolOperation';

import './index.scss';

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
        getResult: (imgIndex: number = 0) => {
          store.dispatch(ChangeSave as unknown as AnyAction);
          return new Promise((resolve) => {
            setTimeout(() => {
              // @ts-ignore
              const imgWithResult = store.getState()?.annotation.imgList[imgIndex];
              const imgResult = JSON.parse(imgWithResult.result as string);
              const ids = [] as string[];
              for (const item of toolList) {
                const tmpResult = [];
                if (item.toolName !== 'tagTool') {
                  if (
                    imgResult[item.toolName] &&
                    imgResult[item.toolName]?.result &&
                    imgResult[item.toolName]?.result?.length > 0
                  ) {
                    for (let i = 0; i < imgResult[item.toolName].result.length; i++) {
                      if (ids.indexOf(imgResult[item.toolName].result[i].id) < 0) {
                        ids.push(imgResult[item.toolName].result[i].id);
                        tmpResult.push(imgResult[item.toolName].result[i]);
                      }
                    }
                  }
                }
                if (tmpResult.length > 0) {
                  imgResult[item.toolName].result = tmpResult;
                }
              }
              // @ts-ignore
              const result = store.getState()?.annotation.imgList;
              // @ts-ignore
              result[imgIndex].result = JSON.stringify(imgResult);
              // @ts-ignore
              resolve(result);
            }, 200);
          });
          // return result;
        },
      };
    },
    [toolInstance],
  );

  return (
    // @ts-ignore
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <App {...props} setToolInstance={setToolInstance} />
      </I18nextProvider>
    </Provider>
  );
};

export type { StepConfig, StepConfigState, BasicConfig, TextConfig, FileInfo } from '@/interface/toolConfig';

export type { AppProps } from '@/App';

export { default as StepUtils } from '@/utils/StepUtils';

export default React.forwardRef(OutputApp);

export { AnnotationView, i18n, VideoTagTool };
