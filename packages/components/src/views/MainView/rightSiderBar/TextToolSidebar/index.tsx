import type { FocusEvent } from 'react';
import React, { useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { Input } from 'antd/es';
import { cKeyCode, uuid } from '@label-u/annotation';
import { useTranslation } from 'react-i18next';

import type { AppState } from '@/store';
import { classnames } from '@/utils';
import { PageForward, UpdateImgList } from '@/store/annotation/actionCreators';
import { ConfigUtils } from '@/utils/ConfigUtils';
import type { IStepInfo } from '@/types/step';
import type { TextConfig } from '@/interface/toolConfig';
import type { IFileItem } from '@/types/data';

const EKeyCode = cKeyCode.default;

const syntheticEventStopPagination = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  e.stopPropagation();
  e.nativeEvent.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
};

interface ITextareaWithFooterProps {
  textareaProps?: any;
  footer?: any;
}

interface IProps {
  dispatch: Function;
  imgList: IFileItem[];
  textConfig: TextConfig;
  imgIndex: number;
  triggerEventAfterIndexChanged: boolean;
  step: number;
  stepList: IStepInfo[];
  basicResultList: any[];
  isPreview: boolean;
}

interface ITextResult {
  id: string;
  sourceID: string;
  value: Record<string, string>;
}

export const TextareaWithFooter = (props: ITextareaWithFooterProps) => {
  const { textareaProps, footer } = props;

  return (
    <>
      <Input.TextArea
        bordered={false}
        rows={6}
        onKeyDown={syntheticEventStopPagination}
        onKeyUp={syntheticEventStopPagination}
        {...textareaProps}
      />
      <div
        className={classnames({
          textAreaLength: true,
        })}
      >
        {footer}
      </div>
    </>
  );
};

export const SingleTextInput = (props: any) => {
  const ref = useRef(null);
  const [textAreaFocus, setTextAreaFocus] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const { t } = useTranslation();

  const { disabled, config, result, updateText, index, switchToNextTextarea, hasMultiple, onNext } = props;
  const { maxLength } = config;
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    if (result && result.length > 0 && result[index]) {
      setValue(result[index].value[config.key]);
    }
  }, [config.key, index, result]);

  const textLength = value?.length ?? 0;

  const updateTextWithKey = (newVal: string) => {
    if (updateText) {
      updateText(newVal, config.key, index);
      if (config.required) {
        setInvalid(!newVal);
      }
    }
  };

  const tabToSwitchEnabled = hasMultiple && switchToNextTextarea;

  const textareaProps = {
    id: `textInput-${index}`,
    ref,
    disabled,
    value,
    maxLength,
    autoSize: { minRows: 2, maxRows: 6 },
    onChange: (e: FocusEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
    },
    onFocus: () => {
      setTextAreaFocus(true);
    },
    onBlur: (e: FocusEvent<HTMLTextAreaElement>) => {
      setTextAreaFocus(false);
      updateTextWithKey(value);
      if (config.required) {
        setInvalid(!e.target.value);
      }
    },
    style: {
      resize: 'none',
      wordBreak: 'break-all',
    },
    onKeyDownCapture: (e: React.KeyboardEvent) => {
      if (e.ctrlKey && e.keyCode === EKeyCode.Enter) {
        if (onNext) {
          onNext();
        }
        e.preventDefault();
      }

      if (e.keyCode === EKeyCode.Tab && tabToSwitchEnabled) {
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        switchToNextTextarea(index);
      }

      e.nativeEvent.stopPropagation();
    },
  };

  const TextareaFooter = (
    <div className="textAreaFooter">
      <div className="hotkeyTip">
        {tabToSwitchEnabled && <span>{`[${t('Switch')}]Tab`}</span>}
        <span>{`[${t('TurnPage')}]Ctrl+Enter`}</span>
      </div>
      <div className="wordCount">
        <span className={textLength >= maxLength ? 'warning' : ''}>{textLength}</span>/<span>{maxLength}</span>
      </div>
    </div>
  );

  useEffect(() => {
    if (disabled) {
      setTextAreaFocus(false);
    }
  }, [disabled]);

  return (
    <div className="textField">
      <div className="label">
        <span className={classnames({ required: config.required })}>{config.label}</span>
        {/* <i
          className={classnames({ clearText: true, disabled: disabled })}
          onClick={() => {
            if (disabled) {
              return;
            }
            updateTextWithKey('');
          }}
        /> */}
      </div>
      <div
        className={classnames({
          disabled,
          'textarea-outline': true,
          'ant-input-focused': textAreaFocus,
          textareaContainer: true,
          focus: textAreaFocus,
          invalid: invalid,
        })}
      >
        <TextareaWithFooter footer={TextareaFooter} textareaProps={textareaProps} />
      </div>
    </div>
  );
};

const TextToolSidebar: React.FC<IProps> = ({
  imgList,
  textConfig,
  imgIndex,
  dispatch,
  isPreview,
  // triggerEventAfterIndexChanged,
  step,
  stepList,
  basicResultList,
}) => {
  const [focusIndex, setFocusIndex] = useState(0);
  const [forceRender, setForceRender] = useState(0);
  const [result, setResult] = useState<ITextResult[]>([]);

  const textareaFocus = (index: number) => {
    setTimeout(() => {
      const textarea = document.getElementById(`textInput-${index}`) as HTMLTextAreaElement;
      if (textarea) {
        setFocusIndex(index);
        textarea.focus();
        textarea.select();
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const switchToNextTextarea = (currentIndex: number) => {
    const nextIndex = (currentIndex + 1) % textConfig.length;
    textareaFocus(nextIndex);
  };

  useEffect(() => {
    if (imgList && imgList.length > 0) {
      const currentImgResult = JSON.parse(imgList[imgIndex].result as string);
      const textResult = currentImgResult?.textTool ? currentImgResult?.textTool.result : [];
      if (textResult && textResult.length > 0) {
        setResult(textResult);
      }
      if (!textResult || textResult.length === 0) {
        if (textConfig && textConfig.length > 0) {
          const res = textConfig.map((item) => {
            return {
              id: uuid(),
              sourceID: '',
              value: { [item.key]: item.default },
            };
          });
          setResult(res);
        }
      }
    }
  }, [textConfig, imgList, imgIndex]);

  const updateText = (v: string, k: string, index: number) => {
    if (v) {
      result[index].value[k] = v;
      const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      const currentImgResult = {
        ...oldImgResult,
        textTool: {
          toolName: 'textTool',
          result: result,
        },
      };
      imgList[imgIndex].result = JSON.stringify(currentImgResult);
      dispatch(UpdateImgList(imgList));
      setResult(result);
    }
  };

  useEffect(() => {
    setForceRender(new Date().getTime());
  }, [result]);

  // useEffect(() => {
  //   if (imgIndex > -1 && triggerEventAfterIndexChanged) {
  //     textareaFocus(0);
  //   }
  // }, [imgIndex]);

  // const result = toolInstance.textList[0]?.value ?? {};

  const onNext = () => {
    dispatch(PageForward(true));
  };

  const stepConfig = ConfigUtils.getStepConfig(stepList, step);
  const disabled = stepConfig.dataSourceStep > 0 && basicResultList.length === 0;

  return (
    <div
      className={classnames({
        textToolOperationMenu: true,
        textToolOperationMenuPreview: isPreview,
      })}
    >
      {result &&
        result.length > 0 &&
        textConfig.map((i, index) => (
          <SingleTextInput
            config={i}
            key={i.key + forceRender}
            index={index}
            result={result}
            updateText={updateText}
            switchToNextTextarea={switchToNextTextarea}
            hasMultiple={textConfig.length > 1}
            focus={focusIndex === index}
            onNext={onNext}
            disabled={disabled}
          />
        ))}
    </div>
  );
};

function mapStateToProps(state: AppState) {
  return {
    imgList: state.annotation.imgList,
    textConfig: state.annotation.textConfig,
    imgIndex: state.annotation.imgIndex,
    step: state.annotation.step,
    basicResultList: state.annotation.basicResultList,
    stepList: state.annotation.stepList,
    triggerEventAfterIndexChanged: state.annotation.triggerEventAfterIndexChanged,
  };
}

export default connect(mapStateToProps)(TextToolSidebar);
