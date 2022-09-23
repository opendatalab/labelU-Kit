// import { COLORS_ARRAY } from '@/constant/style';
import { COLORS_ARRAY } from '@label-u/annotation';
import { addInputList, changeInputList, deleteInputList } from '../../../../utils/tool/editTool';
import { CloseCircleFilled } from '@ant-design/icons';
import { Button, Tabs, Input as SenseInput, message as SenseMessage } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
// import MonacoEditor from 'react-monaco-editor';
// import styles from '../../index.module.scss';
import './index.less';
import { useTranslation } from 'react-i18next';
// const { COLORS_ARRAY } = cStyle;

interface IJsonTabProps {
  value?: any[];
  readonly: boolean;
  onChange?: (value: any[]) => void;
  /** 是否为属性列表 */
  isAttributeList: boolean;
}
const EDIT_SUBSELECTED = false;
const { TabPane } = Tabs;

export const ColorTag = ({ color, style }: any) => {
  return (
    <span
      style={{
        display: 'inline-block',
        height: 14,
        width: 14,
        backgroundColor: color,
        verticalAlign: 'middle',
        ...style
      }}
    />
  );
};

const JSONTab = (props: IJsonTabProps) => {
  const attributeListDom = useRef(null);
  const { t } = useTranslation();
  const {
    value = [
      {
        key: '类别1',
        value: '类别1'
      }
    ],
    readonly,
    onChange,
    isAttributeList
  } = props;

  // useEffect(() => {
  //   setJsonCode(JSON.stringify(value, null, 2));
  //   const inputListLastDom: any = attributeListDom?.current;
  //   if (inputListLastDom) {
  //     inputListLastDom?.scrollIntoView({
  //       behavior: 'smooth',
  //       block: 'end'
  //     });
  //   }
  // }, [value]);

  const addInputInfo = () => {
    onChange?.(addInputList(value, EDIT_SUBSELECTED));
  };

  // const changeTagType = (v: any) => {};

  // 更改标签工具里面的对应值
  const changeInputInfo = (e: any, target: 'key' | 'value', index: number) => {
    onChange?.(changeInputList(e, target, value, index));
  };

  // 删除对应输入
  const deleteInputInfo = (i: number) => {
    onChange?.(deleteInputList(value, i));
  };

  return (
    // <Tabs onChange={changeTagType}>
    //   <TabPane tab={t('Form')} key="1">
    <div>
      {value?.map((info, i) => (
        <div className="sensebee-input-wrap" key={`inputList_${i}`}>
          <div className="select">
            <span className="inputSeria">{i + 1}</span>
            <SenseInput
              className={`sensebee-input`}
              value={info.key}
              placeholder={t('Type')}
              onChange={(e: any) => changeInputInfo(e, 'key', i)}
              disabled={readonly}
              addonBefore={isAttributeList && <ColorTag color={COLORS_ARRAY[i % 8]} />}
            />
            <SenseInput
              className={'sensebee-input'}
              value={info.value}
              placeholder={t('Value')}
              onChange={(e: any) => changeInputInfo(e, 'value', i)}
              disabled={readonly}
            />
          </div>
          {i > 0 && !readonly && (
            <a className="deleteIcon" onClick={() => deleteInputInfo(i)}>
              <CloseCircleFilled />
            </a>
          )}
        </div>
      ))}

      {!readonly && (
        <Button className="addButton" onClick={() => addInputInfo()} ref={attributeListDom}>
          新建
        </Button>
      )}
    </div>
  );
};

export const MapStateJSONTab = JSONTab;
