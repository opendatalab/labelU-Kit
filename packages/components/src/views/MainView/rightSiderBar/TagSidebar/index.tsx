import { CaretRightOutlined } from '@ant-design/icons';
import { Collapse, Tooltip } from 'antd/es';
import { cloneDeep, pickBy } from 'lodash-es';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { OneTag } from '@label-u/annotation';
import { CommonToolUtils, TagUtils, uuid } from '@label-u/annotation';
import { connect, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import type { AppState } from '@/store';
import type { IInputList } from '@/types/main';
import type { ObjectString } from '@/components/videoPlayer/types';
import type { IFileItem } from '@/types/data';
import { ChangeSave, UpdateImgList } from '@/store/annotation/actionCreators';
import CheckBoxList from '@/components/checkboxList';
import RadioList from '@/components/attributeList';

interface IProps {
  imgIndex: number;
  tagConfigList: OneTag[];
  imgList: IFileItem[];
  isPreview: boolean;
}

declare interface ITagResult {
  id: string;
  sourceID: string;
  result: Record<string, string>;
}

const { Panel } = Collapse;

export const expandIconFuc = ({ isActive }: any) => (
  <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ color: 'rgba(0, 0, 0, 0.36)' }} />
);

const TagSidebar: React.FC<IProps> = ({ imgList, tagConfigList, imgIndex, isPreview }) => {
  const [expandKeyList, setExpandKeyList] = useState<string[]>([]);
  const [tagResult, setTagResult] = useState<ITagResult[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  // const [, forceRender] = useState<number>(0);
  // const [hoverDeleteIndex, setHoverDeleteIndex] = useState(-1);
  const { t } = useTranslation();
  // const height = window?.innerHeight - 61 - 200;

  const dispatch = useDispatch();

  //   /**
  //  * 当前页面的标注结果
  //  */
  //   const currentTagResult = useMemo(()=>{
  //     return (
  //       tagResult.filter((v) => {
  //         const basicSourceID = `${v.sourceID}`;
  //         // return CommonToolUtils.isSameSourceID(basicSourceID, this.sourceID);
  //         return true;
  //       })[0] ?? {}
  //     );
  //   },[tagResult])

  const clearTag = () => {
    const parentNode = document.getElementById('toolContainer');
    const oldDom = window.self.document.getElementById('tagToolTag');
    if (oldDom && parentNode && parentNode.contains(oldDom)) {
      parentNode?.removeChild(oldDom);
    }
  };

  useEffect(() => {
    if (imgList && imgList.length > 0) {
      const currentImgResult = JSON.parse(imgList[imgIndex].result as string);
      const tagResult_ = currentImgResult?.tagTool ? currentImgResult?.tagTool?.result : [];
      setTagResult(tagResult_);
    }
  }, [imgIndex, imgList]);

  const renderTag = useCallback(() => {
    clearTag();
    if (!(tagResult?.length > 0)) {
      return;
    }
    const parentNode = document.getElementById('toolContainer');
    const dom = document.createElement('div');
    const tagInfoList = TagUtils.getTagNameList(tagResult[0]?.result ?? {}, tagConfigList);

    dom.innerHTML =
      tagInfoList.reduce((acc: string, cur: { keyName: string; value: string[] }) => {
        return `${acc}${cur.keyName}: ${cur.value.join(` 、 `)}\n`;
      }, '') ?? '';

    dom.setAttribute('id', 'tagToolTag');
    dom.setAttribute(
      'style',
      `
        position: absolute;
        top: 0;
        right: 0;
        z-index: 5;
        padding: 0 20px;
        font-size: 15px;
        color: white;
        text-align: right;
        line-height: 32px;
        white-space: pre;
        background: rgba(102, 111, 255, 1);
        opacity: 0.6;
        clear: both;
      `,
    );
    const preTagToolTag = document.getElementById('tagToolTag');
    if (!parentNode?.contains(preTagToolTag)) {
      parentNode?.appendChild(dom);
    }
  }, [tagConfigList, tagResult]);

  useEffect(() => {
    renderTag();
  }, [renderTag, tagResult]);

  const getTagResultByCode = (num1: number, num2?: number) => {
    try {
      const inputList = tagConfigList;
      const mulitTags = inputList.length > 1;
      const keycode1 = num2 !== undefined ? num1 : 0;
      const keycode2 = num2 !== undefined ? num2 : num1;
      const primaryTagConfig = mulitTags ? inputList[keycode1] : inputList[0];
      const secondaryTagConfig = (primaryTagConfig.subSelected ?? [])[keycode2];

      if (primaryTagConfig && secondaryTagConfig) {
        return {
          value: {
            key: primaryTagConfig.value,
            value: secondaryTagConfig.value,
          },
          isMulti: primaryTagConfig.isMulti,
        };
      }
    } catch {
      return;
    }
  };

  const combineResult = (
    inputValue: { value: { key: string; value: string }; isMulti: boolean },
    existValue: ObjectString = {},
  ) => {
    const { isMulti } = inputValue;
    const { key, value } = inputValue.value;

    if (isMulti) {
      let valuesArray = existValue[key]?.split(';') ?? [];
      if (valuesArray.includes(value)) {
        valuesArray = valuesArray.filter((i) => i !== value);
      } else {
        valuesArray.push(value);
      }

      const valuesSet = new Set(valuesArray);
      existValue[key] = Array.from(valuesSet).join(';');
      return pickBy(existValue, (v) => v);
    }

    existValue[key] = existValue[key] === value ? undefined : value;

    return pickBy(existValue, (v) => v);
  };

  const setLabelBySelectedList = (num1: number, num2?: number) => {
    const newTagConfig = getTagResultByCode(num1, num2);
    if (newTagConfig) {
      const tagRes = combineResult(newTagConfig, tagResult[0]?.result ?? {});
      const result = [
        {
          sourceID: CommonToolUtils.getSourceID(),
          id: uuid(8, 62),
          result: tagRes,
        },
      ];
      const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      const currentImgResult = {
        ...oldImgResult,
        tagTool: {
          toolName: 'tagTool',
          result: [...result],
        },
      };
      imgList[imgIndex].result = JSON.stringify(currentImgResult);
      dispatch(UpdateImgList(imgList));
      setTagResult(result as ITagResult[]);
      dispatch(ChangeSave);
    }
  };

  const setLabel = (num1: number, num2: number) => {
    setLabelBySelectedList(num1, num2);
  };

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

  // basicIndex 到底是那一层
  const labelPanel = (labelInfoSet: IInputList[], basicIndex = -1) => {
    if (!labelInfoSet) {
      return null;
    }

    return labelInfoSet.map((info: IInputList, index: number) => {
      if (info.subSelected) {
        // 判断是否有数据
        // const isResult = TagUtils.judgeResultIsInInputList(
        //   info.value,
        //   currentTagResult?.result?.[info.value],
        //   tagConfigList,
        // );

        return (
          <Collapse
            bordered={false}
            expandIcon={expandIconFuc}
            key={`collapse_${index}_${basicIndex + 1}`}
            onChange={() => setExpendKeyList(index, info.value)}
            activeKey={[info.value]}
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
                          // toolInstance.clearResult(true, info.value);
                        }}
                        // src={hoverDeleteIndex === index || isResult ? clearSmallA : clearSmall}
                        // onMouseEnter={() => {
                        //   setHoverDeleteIndex(index);
                        // }}
                        // onMouseLeave={() => {
                        //   setHoverDeleteIndex(-1);
                        // }}
                      />
                    </Tooltip>
                    {/* {isResult && expandKeyList[index] === '' && <Badge color='#87d068' />} */}
                  </span>

                  {/* {tagConfigList?.length > 1 && selectedButton(index)} */}
                </div>
              }
              key={info.value}
            >
              <div
                className="level"
                // style={{
                //   backgroundColor:
                //     labelSelectedList.length > 0 && labelSelectedList[0] === index
                //       ? 'rgba(158, 158, 158, 0.18)'
                //       : '',
                // }}
              >
                {labelPanel(info.subSelected, index)}
              </div>
            </Panel>
          </Collapse>
        );
      }
      const key = tagConfigList?.[basicIndex] ? tagConfigList?.[basicIndex].value : 0;
      const selectedAttribute = tagResult[0]?.result?.[key]?.split(';')?.indexOf(info.value) > -1 ? info.value : '';

      if (tagConfigList?.[basicIndex]?.isMulti === true) {
        return (
          <div className="singleBar" key={`${key}_${basicIndex}_${index}`}>
            <CheckBoxList
              attributeChanged={() => {
                setLabel(basicIndex, index);
              }}
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
  };

  return (
    <div
      className={classNames({
        tagOperationMenu: true,
        tagOperationMenuPreview: isPreview,
      })}
      ref={sidebarRef}
    >
      {tagConfigList?.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center' }}>{t('NoConfiguration')}</div>
      ) : (
        <div>{labelPanel(tagConfigList)}</div>
      )}
    </div>
  );
};

function mapStateToProps(state: AppState) {
  return {
    imgList: state.annotation.imgList,
    tagConfigList: state.annotation.tagConfigList,
    imgIndex: state.annotation.imgIndex,
  };
}

export default connect(mapStateToProps)(TagSidebar);
