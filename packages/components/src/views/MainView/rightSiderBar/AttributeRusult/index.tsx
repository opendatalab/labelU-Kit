import type { FC, ReactElement } from 'react';
import React, { useLayoutEffect, useEffect, useMemo, useRef, useState } from 'react';
import { Collapse, Form, Input, Popconfirm, Select } from 'antd';
import { connect, useDispatch } from 'react-redux';
import type { PrevResult, Attribute } from '@label-u/annotation';
import { EToolName } from '@label-u/annotation';
import classNames from 'classnames';
import { isEmpty, size, find, some, sortBy, mapKeys } from 'lodash-es';

import AttributeEditorIcon from '@/assets/cssIcon/attribute_editor.svg';
import AttributeShowIcon from '@/assets/cssIcon/attribute_show.svg';
import AttributeUnionIcon from '@/assets/cssIcon/attribute_union.svg';
import emptyAttributeImg from '@/assets/common/emptyAttribute.png';
import AttributeHideIcon from '@/assets/common/attribute_hide.svg';
import { ChangeCurrentTool, UpdateImgList } from '@/store/annotation/actionCreators';
import type { ToolInstance } from '@/store/annotation/types';
import DrageModel from '@/components/dragModal';
import type { IFileItem } from '@/types/data';
import MemoToolIcon from '@/components/ToolIcon';

import { toolList } from '../../toolHeader/ToolOperation';
import type { AppState } from '../../../../store';
import { labelTool } from '../../toolHeader/headerOption';
import { expandIconFuc } from '../TagSidebar';
import ClearResultIconHover from '../../../../assets/annotation/common/clear_result_hover.svg';
import ClearResultIcon from '../../../../assets/annotation/common/clear_result.svg';

const { Panel } = Collapse;

const LableTools = [EToolName.Rect, EToolName.Point, EToolName.Line, EToolName.Polygon];

interface AttributeResult {
  isVisible: boolean;
  attributeName: string;
  attributeTitle: string;
  toolInfo: ToolInfo[];
  color: string;
}

interface ToolInfo {
  toolName: string;
  order: number;
  isVisible: boolean;
  icon: any;
  textAttribute: string;
}

interface IProps {
  isPreview: boolean;
  attributeList: Attribute[];
  imgIndex: number;
  imgList: IFileItem[];
  toolInstance: ToolInstance;
  copyToolInstance: ToolInstance;
  currentToolName: string;
  basicResultList: [];
  isShowClear: boolean;
}

const AttributeRusult: FC<IProps> = ({
  imgIndex,
  imgList,
  toolInstance,
  currentToolName,
  copyToolInstance,
  attributeList,
  basicResultList,
}) => {
  const [attributeResultList, setAttributeResultList] = useState<AttributeResult[]>([]);
  // const attributeShowRef = useRef<HTMLImageElement>(null);
  const dispatch = useDispatch();
  // 将标注结果转换为attributeResultList 格式
  const [content, setContent] = useState<ReactElement>(<div />);
  // 当前选中标签
  const [activeOrder, setActiveOrder] = useState<number>();
  // const [result,setResult] = useState();
  const [chooseToolInfo, setChooseToolInfo] = useState<ToolInfo>({
    toolName: '',
    order: -1,
    isVisible: true,
    icon: '',
    textAttribute: '',
  });
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isClearnHover, setIsClearHover] = useState<boolean>(false);
  const allAttributesMap = useMemo(() => toolInstance?.allAttributesMap ?? new Map(), [toolInstance?.allAttributesMap]);

  const initToolInfo = () => {
    const initStr = JSON.stringify({
      toolName: '',
      order: -1,
      isVisible: true,
      icon: '',
      textAttribute: '',
    });
    localStorage.setItem('toolInfo', initStr);
  };

  // 更新pre 标注结果
  const updateCanvasView = (newLabelResult: any) => {
    const prevResult: PrevResult[] = [];
    for (const oneTool of toolList) {
      if (oneTool.toolName !== currentToolName && newLabelResult[oneTool.toolName]) {
        const onePrevResult = {
          toolName: oneTool.toolName,
          result: newLabelResult[oneTool.toolName].result,
        };
        prevResult.push(onePrevResult);
      }
      if (oneTool.toolName === currentToolName) {
        toolInstance.setResult(newLabelResult[oneTool.toolName].result);
      }
    }
    toolInstance.setPrevResultList(prevResult);
    toolInstance.render();
  };

  // 删除标注结果
  const doClearAllResult = () => {
    const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    for (const tool of labelTool) {
      const tmpResult = oldImgResult[tool]?.result;
      if (tmpResult && tmpResult.length > 0) {
        oldImgResult[tool].result = [];
      }
    }
    imgList[imgIndex].result = JSON.stringify(oldImgResult);
    dispatch(UpdateImgList(imgList));
    updateCanvasView(oldImgResult);
  };

  const handleOk = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      doClearAllResult();
      setOpen(false);
      setConfirmLoading(false);
    }, 100);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const dragModalRef = useRef<any>();
  useEffect(() => {
    initToolInfo();
  }, []);

  const showPopconfirm = () => {
    setOpen(true);
  };

  const [boxHeight, setBoxHeight] = useState<number>();
  const [, setBoxWidth] = useState<number>();
  const attributeResultRef = useRef<HTMLDivElement>(null);

  // 将右侧属性栏高度设置为剩余高度
  useLayoutEffect(() => {
    if (!attributeResultRef.current) {
      return;
    }

    const rect = attributeResultRef.current.parentElement!.getBoundingClientRect();
    const attributeWrapperHeight = window.innerHeight - rect.top;
    attributeResultRef.current.style.height = `${attributeWrapperHeight}px`;
  }, []);

  useEffect(() => {
    const boxParent = document.getElementById('annotationCotentAreaIdtoGetBox')?.parentNode as HTMLElement;
    setBoxHeight(boxParent.clientHeight);
    setBoxWidth(boxParent.clientWidth);
  }, []);

  // 工具选中后联动标注结果选中项
  useEffect(() => {
    const activeId =
      currentToolName === EToolName.Rect
        ? // @ts-ignore
          copyToolInstance?.selectedRectID
        : // @ts-ignore
          copyToolInstance?.selectedID;
    if (activeId && imgList && imgList.length > imgIndex) {
      const toolInfoStr = localStorage.getItem('toolInfo');
      if (toolInfoStr && toolInfoStr.length > 0) {
        const imgResult = JSON.parse(imgList[imgIndex].result as string);
        for (const item of imgResult[currentToolName]?.result) {
          if (item.id === activeId) {
            setActiveOrder(item.order);
          }
        }
      }
    } else {
      setActiveOrder(0);
    }
    // @ts-ignore
  }, [copyToolInstance, currentToolName, imgIndex, imgList]);

  useEffect(() => {
    if (isEmpty(imgList) || size(imgList) <= imgIndex) {
      return;
    }

    const currentImgResult = JSON.parse(imgList[imgIndex].result as string);
    const resultKeys = Object.keys(currentImgResult);
    const attributeMap = new Map();

    for (const item of toolList) {
      if (!resultKeys.includes(item.toolName) || item.toolName === 'tagTool') {
        continue;
      }

      const result = currentImgResult[item.toolName].result;

      if (!result || !Array.isArray(result)) {
        continue;
      }

      // Fix: https://project.feishu.cn/bigdata_03/issue/detail/4136011?parentUrl=%2Fbigdata_03%2FissueView%2FXARIG5p4g
      for (const oneLabel of sortBy(result, 'order')) {
        if (attributeMap.has(oneLabel.attribute)) {
          const tmpToolInfo = attributeMap.get(oneLabel.attribute);
          // 去重
          if (!find(tmpToolInfo, (_item) => _item.order === oneLabel.order)) {
            tmpToolInfo.push({
              toolName: item.toolName,
              order: oneLabel.order,
              icon: item.Icon,
              isVisible: oneLabel.isVisible,
              textAttribute: oneLabel.textAttribute,
            });
          }
        } else {
          attributeMap.set(oneLabel.attribute, [
            {
              toolName: item.toolName,
              order: oneLabel.order,
              icon: item.Icon,
              isVisible: oneLabel.isVisible,
              textAttribute: oneLabel.textAttribute,
            },
          ]);
        }
      }
    }
    // 初始化attributeResultList
    const tmpAttributeResult: AttributeResult[] = [];

    for (const key of attributeMap.keys()) {
      const toolInfo = attributeMap.get(key);
      tmpAttributeResult.push({
        isVisible: some(toolInfo, (item) => item.isVisible),
        attributeName: key,
        attributeTitle: allAttributesMap.get(key) || key,
        toolInfo: attributeMap.get(key),
        color: toolInstance.getColor(key)?.valid.stroke,
      });
    }
    setAttributeResultList(tmpAttributeResult);
  }, [imgList, imgIndex, toolInstance, allAttributesMap]);

  // 修改标注描述信息 || 修改是否可以显示
  const updateLabelResult = (toolInfo: ToolInfo) => {
    if (imgList && imgList.length > 0 && imgList.length > imgIndex) {
      const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      // 更新结果
      if (oldImgResult[toolInfo.toolName].result && oldImgResult[toolInfo.toolName].result.length > 0) {
        const newToolLabelItems = oldImgResult[toolInfo.toolName].result.map(
          (item: { order: number; isVisible: boolean }) => {
            if (item.order === toolInfo.order) {
              return {
                ...item,
                isVisible: toolInfo.isVisible,
                textAttribute: toolInfo.textAttribute,
              };
            }
            return item;
          },
        );
        oldImgResult[toolInfo.toolName].result = newToolLabelItems;
      }
      imgList[imgIndex].result = JSON.stringify(oldImgResult);
      dispatch(UpdateImgList(imgList));
      updateCanvasView(oldImgResult);
    }
  };

  // 批量修改是否可以显示
  const updateLabelsResult = (attributeResult: AttributeResult) => {
    const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    // 更新标注结果
    let newToolInfo: ToolInfo[] = [];
    if (attributeResult.toolInfo.length > 0) {
      newToolInfo = attributeResult.toolInfo.map((item) => {
        return { ...item, isVisible: attributeResult.isVisible };
      });
    }
    attributeResult.toolInfo = newToolInfo;
    const newAttributeResultList = attributeResultList.map((item) => {
      if (item.attributeName === attributeResult.attributeName) {
        return { ...attributeResult };
      }
      return item;
    });
    setAttributeResultList(newAttributeResultList);
    // 更新显示结果
    if (attributeResult.toolInfo && attributeResult.toolInfo.length > 0) {
      for (const oneTool of attributeResult.toolInfo) {
        if (oldImgResult[oneTool.toolName].result && oldImgResult[oneTool.toolName].result.length > 0) {
          const newToolLabelItems = oldImgResult[oneTool.toolName].result.map(
            (item: { order: number; isVisible: boolean }) => {
              if (item.order === oneTool.order) {
                return {
                  ...item,
                  isVisible: attributeResult.isVisible,
                };
              }
              return item;
            },
          );
          oldImgResult[oneTool.toolName].result = newToolLabelItems;
        }
      }
      imgList[imgIndex].result = JSON.stringify(oldImgResult);
      dispatch(UpdateImgList(imgList));
      updateCanvasView(oldImgResult);
    }
  };

  // 批量删除标注
  const deleteLabelByAttribute = (attributeResult: AttributeResult) => {
    const getPositionIndexInArr = (arr: number[], value: number) => {
      let p = 0;
      if (arr?.length > 0) {
        while (p < arr.length) {
          if (value >= arr[p]) {
            p++;
          } else {
            break;
          }
        }
      }
      return p;
    };

    if (attributeResult && attributeResult.toolInfo && attributeResult.toolInfo.length > 0) {
      // 获取删除标注结果order 数组
      const deleteResult = attributeResult.toolInfo
        .map((item) => {
          return item.order;
        })
        .sort((a, b) => a - b);

      const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      const newImgResult = { ...oldImgResult };
      // 获取已用工具列表
      const keys = Object.keys(oldImgResult);
      const toolList_ = keys.filter((item) => {
        return LableTools.indexOf(item as EToolName) >= 0;
      });

      for (let i = 0; i < toolList_.length; i++) {
        newImgResult[toolList_[i]].result = oldImgResult[toolList_[i]].result.reduce(
          (res: { order: number; isVisible: boolean }[], item: { order: number; isVisible: boolean }) => {
            if (deleteResult.indexOf(item.order) < 0) {
              item.order = item.order - getPositionIndexInArr(deleteResult, item.order);
              res.push(item);
            }
            return res;
          },
          [],
        );
      }
      imgList[imgIndex].result = JSON.stringify(newImgResult);
      dispatch(UpdateImgList(imgList));
      updateCanvasView(newImgResult);
    }
  };

  // 删除标注
  const delelteLabel = (toolInfo: ToolInfo) => {
    const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    const newImageResult = { ...oldImgResult };
    // 更新结果
    if (oldImgResult[toolInfo.toolName].result && oldImgResult[toolInfo.toolName].result.length > 0) {
      // 获取已用工具列表
      const keys = Object.keys(oldImgResult);
      const toolList_ = keys.filter((item) => {
        return LableTools.indexOf(item as EToolName) >= 0;
      });

      for (let i = 0; i < toolList_.length; i++) {
        newImageResult[toolList_[i]].result = oldImgResult[toolList_[i]].result.reduce(
          (res: { order: number; isVisible: boolean }[], item: { order: number; isVisible: boolean }) => {
            if (item.order !== toolInfo.order) {
              if (item.order > toolInfo.order) {
                item.order = item.order - 1;
              }
              res.push(item);
            }
            return res;
          },
          [],
        );
      }
    }
    imgList[imgIndex].result = JSON.stringify(newImageResult);
    dispatch(UpdateImgList(imgList));
    updateCanvasView(newImageResult);
  };

  // 根据标签及工具 修改标签及描述
  const updateLabelResultByOrderAndToolName = (
    order: number,
    fromToolName: string,
    toAttributeName: string,
    toAttributeText: string,
  ) => {
    const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    // 更新结果
    if (oldImgResult[fromToolName].result && oldImgResult[fromToolName].result.length > 0) {
      const newToolLabelItems = oldImgResult[fromToolName].result.map(
        (item: { order: number; isVisible: boolean; attribute: string; textAttribute: string }) => {
          if (item.order === order) {
            return {
              ...item,
              attribute: toAttributeName,
              textAttribute: toAttributeText,
            };
          }
          return item;
        },
      );
      oldImgResult[fromToolName].result = newToolLabelItems;
    }
    imgList[imgIndex].result = JSON.stringify(oldImgResult);
    dispatch(UpdateImgList(imgList));
    updateCanvasView(oldImgResult);
  };

  // 设置选中线条
  const setSelectedLabel = (toolInfo: ToolInfo, attributeInfo: AttributeResult) => {
    // 选中当前标注
    const toolInfoStr = JSON.stringify(toolInfo);
    localStorage.setItem('toolInfo', toolInfoStr);
    // 切换工具
    dispatch(ChangeCurrentTool(toolInfo.toolName));
    setChooseToolInfo(toolInfo);
    // NOTE: 加setTimeout是为了解决：右侧不同工具标签切换时，会将上一个工具的标签设置为下一个工具的标签
    setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent('attribute::change', {
          detail: attributeInfo.attributeName,
        }),
      );
    });
  };

  useEffect(() => {
    if (imgList && basicResultList && imgList.length > imgIndex) {
      const toolInfoStr = localStorage.getItem('toolInfo');
      // 获取basicReuslt 有哪几种标注结果
      const basicResultTools = basicResultList.reduce((res, item: { toolName: string }) => {
        res.push(item.toolName);
        return res;
      }, [] as string[]);

      if (toolInfoStr && toolInfoStr.length > 0) {
        const chooseToolInfo_ = JSON.parse(toolInfoStr as string);
        const imgResult = JSON.parse(imgList[imgIndex].result as string);
        if (
          toolInstance &&
          chooseToolInfo_.toolName &&
          chooseToolInfo_.toolName === currentToolName &&
          basicResultTools.indexOf(chooseToolInfo_.toolName) < 0 &&
          imgResult[chooseToolInfo_.toolName].result &&
          imgResult[chooseToolInfo_.toolName].result.length > 0
        ) {
          for (const item of imgResult[chooseToolInfo_.toolName].result) {
            if (item.order === chooseToolInfo_.order) {
              // eslint-disable-next-line max-depth
              if (chooseToolInfo_.toolName === EToolName.Line) {
                // @ts-ignore
                toolInstance?.setActiveAreaByPoint(item?.pointList[0]);
                // 选中之后，重新初始化
                initToolInfo();
              } else if (chooseToolInfo_.toolName === EToolName.Point) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // 选中之后，重新初始化
                initToolInfo();
              } else if (chooseToolInfo_.toolName === EToolName.Polygon) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // 选中之后，重新初始化
                initToolInfo();
              } else if (chooseToolInfo_.toolName === EToolName.Rect) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // 选中之后，重新初始化
                initToolInfo();
              }
            }
          }
        }
      }
    }
  }, [toolInstance, basicResultList, chooseToolInfo, imgList, imgIndex, currentToolName]);

  const defaultKeys = useMemo(() => {
    const keys = attributeResultList.map((attribute) => {
      return attribute.attributeName;
    });
    return keys;
  }, [attributeResultList]);

  const generateContent = (toolInfo: ToolInfo, attributeResult: AttributeResult) => {
    const options = attributeList.map((item) => ({
      label: item.key,
      value: item.value,
    }));
    options.push({
      label: '无标签',
      value: 'noneAttribute',
    });
    const optionsMap = mapKeys(options, 'value');
    const value = optionsMap[attributeResult.attributeName]
      ? attributeResult.attributeName
      : allAttributesMap.get(attributeResult.attributeName);
    return (
      <Form
        name="basic"
        layout="vertical"
        key={new Date().getTime()}
        initialValues={{
          changeAttribute: value,
          description: toolInfo.textAttribute,
        }}
        autoComplete="off"
        onFieldsChange={(_, allFields) => {
          updateLabelResultByOrderAndToolName(
            toolInfo.order,
            toolInfo.toolName,
            allFields[0].value,
            allFields[1].value,
          );
        }}
      >
        <Form.Item
          label="标签"
          name="changeAttribute"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            value={value}
            optionLabelProp="label"
            options={options}
            style={{
              width: '100%',
            }}
          />
        </Form.Item>
        <Form.Item
          label="描述"
          name="description"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input.TextArea value={toolInfo.textAttribute} />
        </Form.Item>
      </Form>
    );
  };

  return (
    <>
      {isEmpty(attributeResultList) && (
        <div className="containerBox" style={{ height: (boxHeight as number) - 220 }}>
          <img className="emptyAttributeImg" src={emptyAttributeImg} />
        </div>
      )}
      <div
        style={{ paddingBottom: 40, display: isEmpty(attributeResultList) ? 'none' : 'block' }}
        className={classNames({
          attributeResult: true,
        })}
        ref={attributeResultRef}
      >
        <DrageModel title="详细信息" ref={dragModalRef} width={333} okWord="确认" cancelWord="取消" content={content} />
        <Collapse
          key={defaultKeys.join('')}
          className="attribute-panel"
          defaultActiveKey={defaultKeys}
          expandIcon={expandIconFuc}
        >
          {attributeResultList &&
            attributeResultList.length > 0 &&
            attributeResultList.map((item) => {
              return (
                <Panel
                  header={
                    <div className="attributeResultLi">
                      <span
                        title={item.attributeTitle}
                        style={{
                          marginRight: '36px',
                          width: '84px',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      >
                        {item.attributeTitle}
                      </span>{' '}
                      <div className="attributeResultRightImgBox">
                        {item.isVisible ? (
                          <img
                            className="hoverShow"
                            id={`${item.attributeName}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateLabelsResult({ ...item, isVisible: false });
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                            }}
                            src={AttributeShowIcon}
                            style={{ marginRight: '10px' }}
                          />
                        ) : (
                          <img
                            onClick={(e) => {
                              e.stopPropagation();
                              updateLabelsResult({ ...item, isVisible: true });
                            }}
                            src={AttributeHideIcon}
                            style={{ marginRight: '10px' }}
                          />
                        )}
                        <img
                          src={AttributeUnionIcon}
                          className="hoverShow"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLabelByAttribute(item);
                          }}
                        />
                      </div>
                    </div>
                  }
                  key={item.attributeName}
                >
                  {item.toolInfo &&
                    item.toolInfo.length > 0 &&
                    item.toolInfo.map((tItem) => {
                      return (
                        <div
                          // key={item.attributeName}
                          key={tItem.toolName + tItem.order}
                          className={classNames({
                            attributeResultLi: true,
                            attributeResultLiActive: tItem.order === activeOrder,
                          })}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLabel(tItem, item);
                          }}
                        >
                          <span>{tItem.order}.</span>

                          <MemoToolIcon icon={tItem.icon} style={{ color: item.color, width: 20 }} />
                          <span
                            title={item.attributeTitle}
                            style={{
                              marginRight: '36px',
                              width: '84px',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                            }}
                          >
                            {item.attributeTitle}
                          </span>
                          <div className="attributeResultRightImgBox">
                            <img
                              id={`${tItem.toolName + tItem.order} + edit`}
                              onClick={(e) => {
                                e.stopPropagation();
                                // @ts-ignore
                                const boundingClientRect = document
                                  .getElementById(`${tItem.toolName + tItem.order} + edit`)
                                  .getBoundingClientRect();
                                const tmpBounds = {
                                  left: boundingClientRect.left - 50,
                                  top: boundingClientRect.top,
                                };

                                dragModalRef.current.switchModal(true);
                                dragModalRef.current.switchSetBounds(tmpBounds);
                                setContent(generateContent(tItem, item));
                              }}
                              src={AttributeEditorIcon}
                              className="hoverShow"
                              style={{ left: 10, position: 'absolute' }}
                            />
                            {tItem.isVisible ? (
                              <img
                                className="hoverShow"
                                id={`${tItem.toolName + tItem.order}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newTItem = { ...tItem, isVisible: false };
                                  updateLabelResult(newTItem);
                                }}
                                onMouseLeave={(e) => {
                                  e.stopPropagation();
                                  // attributeShowRef.current?.setAttribute('src', AttributeShowIcon);
                                  document
                                    .getElementById(`${tItem.toolName + tItem.order}`)
                                    ?.setAttribute('src', AttributeShowIcon);
                                }}
                                src={AttributeShowIcon}
                                style={{ left: 30, position: 'absolute' }}
                              />
                            ) : (
                              <img
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // updateLabelVisible(tItem, true);
                                  const newTItem = { ...tItem, isVisible: true };
                                  updateLabelResult(newTItem);
                                }}
                                src={AttributeHideIcon}
                                style={{ left: 30, position: 'absolute' }}
                              />
                            )}
                            <img
                              style={{ left: 50, position: 'absolute' }}
                              src={AttributeUnionIcon}
                              className="hoverShow"
                              onClick={(e) => {
                                e.stopPropagation();
                                delelteLabel(tItem);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </Panel>
              );
            })}
        </Collapse>
        <Popconfirm
          title="确认清空标注？"
          open={open}
          okText="确认"
          cancelText="取消"
          onConfirm={handleOk}
          okButtonProps={{ loading: confirmLoading }}
          onCancel={handleCancel}
        >
          <button
            className="rightBarFooter"
            onClick={showPopconfirm}
            onMouseEnter={(e) => {
              e.stopPropagation();
              setIsClearHover(true);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setIsClearHover(false);
            }}
          >
            <img className="clrearResult" src={isClearnHover ? ClearResultIconHover : ClearResultIcon} />
          </button>
        </Popconfirm>
      </div>
    </>
  );
};

const getStateMap = (state: AppState) => {
  return {
    imgList: [...state.annotation.imgList],
    imgIndex: state.annotation.imgIndex,
    toolInstance: state.annotation.toolInstance,
    copyToolInstance: { ...state.annotation.toolInstance },
    currentToolName: state.annotation.currentToolName,
    attributeList: state.annotation.toolInstance.config.attributeList,
    basicResultList: state.annotation.basicResultList,
  };
};

export default connect(getStateMap)(AttributeRusult);
