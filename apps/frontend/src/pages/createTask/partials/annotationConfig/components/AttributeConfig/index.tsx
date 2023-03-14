import { CloseCircleFilled } from '@ant-design/icons';
import { Button, Input as SenseInput } from 'antd';
import { useEffect, useRef, useState } from 'react';
import './index.scss';
import { useTranslation } from 'react-i18next';

import scrollIntoEventTarget from '@/utils/scrollIntoEventTarget';
import { addInputList, changeInputList, deleteInputList } from '@/utils/tool/editTool';
import { CHECK_INPUT_VALUE } from '@/pages/createTask';

interface IJsonTabProps {
  value?: any[];
  readonly: boolean;
  onChange?: (value: any[]) => void;
  // 提交
  onSubmitAction?: () => void;
  /** 是否为属性列表 */
  isAttributeList: boolean;
}
const EDIT_SUBSELECTED = false;

export const ColorTag = ({ color, style }: any) => {
  return (
    <span
      style={{
        display: 'inline-block',
        height: 14,
        width: 14,
        backgroundColor: color,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
};

const JSONTab = (props: IJsonTabProps) => {
  const attributeListDom = useRef(null);
  const [isHover, setIsHover] = useState<string>();
  const [inputChecked, setInputChecked] = useState(false);

  const { t } = useTranslation();
  const {
    value = [
      {
        key: '类别1',
        value: '类别1',
      },
    ],
    readonly,
    onChange,
    onSubmitAction,
  } = props;

  const addInputInfo = (e: React.MouseEvent) => {
    onChange?.(addInputList(value, EDIT_SUBSELECTED));
    onSubmitAction?.();
    // fix: https://project.feishu.cn/bigdata_03/issue/detail/3528090?parentUrl=%2Fbigdata_03%2FissueView%2FXARIG5p4g
    scrollIntoEventTarget(e, 'button', '#lefeSiderId');
  };

  // const changeTagType = (v: any) => {};

  // 更改标签工具里面的对应值
  const changeInputInfo = (e: any, target: 'key' | 'value', index: number) => {
    onChange?.(changeInputList(e, target, value, index));
  };

  // 删除对应输入
  const deleteInputInfo = (i: number) => {
    onChange?.(deleteInputList(value, i));
    // 删除行提交
    onSubmitAction?.();
  };

  useEffect(() => {
    const saveToolsConfig = () => {
      setInputChecked(true);
    };

    document.addEventListener(CHECK_INPUT_VALUE, saveToolsConfig as EventListener);
    return () => {
      document.removeEventListener(CHECK_INPUT_VALUE, saveToolsConfig as EventListener);
    };
  }, []);

  return (
    <div>
      {value &&
        value.length > 0 &&
        value?.map((info, i) => (
          <div
            className="sensebee-input-wrap"
            key={`inputList_${i}`}
            onMouseOver={(e) => {
              e.stopPropagation();
              setIsHover(info.key + i);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setIsHover('');
            }}
          >
            <div className="select">
              <span className="inputSeria">{i + 1}</span>
              <SenseInput
                className={`sensebee-input`}
                value={info.key}
                placeholder={t('中文（前端显示）')}
                onChange={(e: any) => changeInputInfo(e, 'key', i)}
                disabled={readonly}
                onBlur={onSubmitAction}
                status={inputChecked && info.key === '' ? 'error' : undefined}
                bordered={inputChecked && info.key === ''}
                // addonBefore={isAttributeList && <ColorTag color={COLORS_ARRAY[i % 8]} />}
              />
              <SenseInput
                className={'sensebee-input'}
                value={info.value}
                placeholder={t('英文（保存结果）')}
                onChange={(e: any) => changeInputInfo(e, 'value', i)}
                onBlur={onSubmitAction}
                disabled={readonly}
                status={inputChecked && info.value === '' ? 'error' : undefined}
                bordered={inputChecked && info.value === ''}
              />
            </div>
            {i > 0 && !readonly && isHover === info?.key + i && (
              <CloseCircleFilled className="deleteIcon" onClick={() => deleteInputInfo(i)} />
            )}
          </div>
        ))}

      {!readonly && (
        <Button
          type="primary"
          className="addButton"
          onClick={(e) => {
            addInputInfo(e);
            setInputChecked(false);
          }}
          ref={attributeListDom}
          ghost
        >
          新建
        </Button>
      )}
    </div>
  );
};

export const MapStateJSONTab = JSONTab;
