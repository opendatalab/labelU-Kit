import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CaretRightOutlined } from '@ant-design/icons';
import { Badge, Collapse, Tooltip } from 'antd/es';
import { cloneDeep } from 'lodash-es';
import type { TagOperation } from '@label-u/annotation';
import { TagUtils } from '@label-u/annotation';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';

import clearSmall from '@/assets/annotation/common/icon_clearSmall.svg';
import clearSmallA from '@/assets/annotation/common/icon_clearSmall_a.svg';
import type { AppState } from '@/store';
import type { IInputList } from '@/types/main';
import CheckBoxList from '@/components/checkboxList';
import RadioList from '@/components/attributeList';

interface IProps {
  imgIndex: number;
  toolInstance: TagOperation;
}

const { Panel } = Collapse;

export const expandIconFuc = ({ isActive }: any) => <CaretRightOutlined rotate={isActive ? 90 : 0} />;

const TagSidebar: React.FC<IProps> = ({ toolInstance, imgIndex }) => {
  const {
    labelSelectedList,
    config: { inputList },
    currentTagResult,
    setLabel,
  } = toolInstance;

  const [expandKeyList, setExpandKeyList] = useState<string[]>([]);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [, forceRender] = useState<number>(0);
  const [hoverDeleteIndex, setHoverDeleteIndex] = useState(-1);
  const { t } = useTranslation();

  const setExpendKeyList = useCallback(
    (index: number, value: string, expend?: boolean) => {
      const newKeyList = cloneDeep(expandKeyList);
      if (newKeyList[index] === '' || expend === true) {
        newKeyList[index] = value;
      } else {
        newKeyList[index] = '';
      }
      setExpandKeyList(newKeyList);
    },
    [expandKeyList],
  );

  const expendRender = useCallback(() => {
    const index = toolInstance.labelSelectedList[0];
    const value = inputList.filter((v: IInputList, i: number) => i === index)[0]?.value;
    setExpendKeyList(index, value, true);
  }, [inputList, setExpendKeyList, toolInstance.labelSelectedList]);

  useEffect(() => {
    if (toolInstance) {
      // 用于配置的初始化
      setExpandKeyList(toolInstance.config.inputList.map((v: IInputList) => v.value));

      // 进行实时渲染
      toolInstance.singleOn('render', () => {
        forceRender((s) => s + 1);
      });
    }
  }, [toolInstance]);

  useEffect(() => {
    if (toolInstance) {
      // 该写法会不断的重复绑定，后续写法上可以更改（如果将 singleOn 改为 on 会有很大问题）
      toolInstance.singleOn('expend', expendRender);

      if (toolInstance.labelSelectedList.length === 1) {
        let height = 0;
        for (let i = 0; i < toolInstance.labelSelectedList[0]; i++) {
          height += 46;
          if (inputList[i] && expandKeyList[i] !== '') {
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            inputList[i].subSelected.forEach(() => (height += 40));
          }
        }
        if (sidebarRef.current) {
          sidebarRef.current.children[0].scrollTop = height;
        }
      }
    }
  }, [expandKeyList, expendRender, inputList, toolInstance]);

  useEffect(() => {
    // 翻页侧边栏跳到最上
    if (sidebarRef.current) {
      sidebarRef.current.children[0].scrollTop = 0;
    }
  }, [imgIndex]);

  const selectedButton = useCallback(
    (index: number) => {
      if (labelSelectedList.length > 0 && labelSelectedList[0] === index) {
        return <span className="keyDownIconActive">{index + 1}</span>;
      }
      return <span className="keyDownIcon">{index + 1}</span>;
    },
    [labelSelectedList],
  );

  // basicIndex 到底是那一层
  const labelPanel = useCallback(
    (labelInfoSet: IInputList[], basicIndex = -1) => {
      if (!labelInfoSet) {
        return null;
      }

      return labelInfoSet.map((info: IInputList, index: number) => {
        if (info.subSelected) {
          // 判断是否有数据
          const isResult = TagUtils.judgeResultIsInInputList(
            info.value,
            currentTagResult?.result?.[info.value],
            inputList,
          );

          return (
            <Collapse
              bordered={false}
              expandIcon={expandIconFuc}
              key={`collapse_${index}_${basicIndex + 1}`}
              onChange={() => setExpendKeyList(index, info.value)}
              activeKey={[expandKeyList[index]]}
            >
              <Panel
                header={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flex: 1,
                    }}
                  >
                    <span>
                      {info.key}
                      <Tooltip placement="bottom" title={t('ClearThisOption')}>
                        <img
                          style={{ marginLeft: 5, cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toolInstance.clearResult(true, info.value);
                          }}
                          src={hoverDeleteIndex === index || isResult ? clearSmallA : clearSmall}
                          onMouseEnter={() => {
                            setHoverDeleteIndex(index);
                          }}
                          onMouseLeave={() => {
                            setHoverDeleteIndex(-1);
                          }}
                        />
                      </Tooltip>
                      {isResult && expandKeyList[index] === '' && <Badge color="#87d068" />}
                    </span>

                    {inputList?.length > 1 && selectedButton(index)}
                  </div>
                }
                key={info.value}
              >
                <div
                  className="level"
                  style={{
                    backgroundColor:
                      labelSelectedList.length > 0 && labelSelectedList[0] === index ? 'rgba(158, 158, 158, 0.18)' : '',
                  }}
                >
                  {labelPanel(info.subSelected, index)}
                </div>
              </Panel>
            </Collapse>
          );
        }
        const key = inputList?.[basicIndex] ? inputList?.[basicIndex].value : 0;
        const selectedAttribute =
          currentTagResult?.result?.[key]?.split(';')?.indexOf(info.value) > -1 ? info.value : '';

        if (inputList?.[basicIndex]?.isMulti === true) {
          return (
            <div className="singleBar" key={`${key}_${basicIndex}_${index}`}>
              <CheckBoxList
                attributeChanged={() => setLabel(basicIndex, index)}
                selectedAttribute={[selectedAttribute]}
                list={[{ value: info.value, label: info.key }]}
                num={index + 1}
              />
            </div>
          );
        }
        return (
          <div className="singleBar" key={`${key}_${basicIndex}_${index}`}>
            <RadioList
              forbidColor
              attributeChanged={() => setLabel(basicIndex, index)}
              selectedAttribute={selectedAttribute}
              list={[{ value: info.value, label: info.key }]}
              num={index + 1}
            />
          </div>
        );
      });
    },
    [
      currentTagResult?.result,
      expandKeyList,
      hoverDeleteIndex,
      inputList,
      labelSelectedList,
      selectedButton,
      setExpendKeyList,
      setLabel,
      t,
      toolInstance,
    ],
  );
  const height = window?.innerHeight - 61 - 80;

  if (!toolInstance) {
    return null;
  }

  return (
    <div className="tagOperationMenu" ref={sidebarRef}>
      {inputList?.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center' }}>{t('NoConfiguration')}</div>
      ) : (
        <div style={{ height }}>{labelPanel(inputList)}</div>
      )}
    </div>
  );
};

function mapStateToProps(state: AppState) {
  return { toolInstance: state.annotation.toolInstance, imgIndex: state.annotation.imgIndex };
}

export default connect(mapStateToProps)(TagSidebar);
