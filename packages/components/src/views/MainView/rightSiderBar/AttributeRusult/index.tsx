import React, { FC, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { Collapse, Form, Input, Select } from 'antd';
import { AppState } from '../../../../store';
import { connect, useDispatch } from 'react-redux';
import { IFileItem } from '@/types/data';
import _ from 'lodash';
import { toolList } from '../../toolHeader/ToolOperation';
import AttributeEditorIcon from '@/assets/cssIcon/attribute_editor.svg';
import AttributeShowIcon from '@/assets/cssIcon/attribute_show.svg';
import AttributeUnionIcon from '@/assets/cssIcon/attribute_union.svg';
import emptyAttributeImg from '@/assets/common/emptyAttribute.png';
import AttributeHideIcon from '@/assets/common/attribute_hide.svg';
// import AttributeShowHoverIcon from '@/assets/common/attribute_show_hover.svg';
import { ChangeCurrentTool, UpdateImgList } from '@/store/annotation/actionCreators';
import { ToolInstance } from '@/store/annotation/types';
import { PrevResult, Attribute, EToolName } from '@label-u/annotation';
import DrageModel from '@/components/dragModal';
import classNames from 'classnames';
import { expandIconFuc } from '../TagSidebar';

const { Panel } = Collapse;
const { Option } = Select;

const LableTools = [EToolName.Rect, EToolName.Point, EToolName.Line, EToolName.Polygon];

interface AttributeResult {
  isVisible: boolean;
  attributeName: string;
  toolInfo: ToolInfo[];
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
}

const AttributeRusult: FC<IProps> = ({
  isPreview,
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
  // ????????????????????????attributeResultList ??????
  const [content, setContent] = useState<ReactElement>(<div />);
  // ??????????????????
  const [activeOrder, setActiveOrder] = useState<number>();
  // const [result,setResult] = useState();
  const [chooseToolInfo, setChooseToolInfo] = useState<ToolInfo>({
    toolName: '',
    order: -1,
    isVisible: true,
    icon: '',
    textAttribute: '',
  });

  const dragModalRef = useRef<any>();
  useEffect(() => {
    initToolInfo();
  }, []);

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

  // ??????????????????????????????????????????
  useEffect(() => {
    const activeId =
      currentToolName === EToolName.Rect
        ? // @ts-ignore
          copyToolInstance?.selectedRectID
        : // @ts-ignore
          copyToolInstance?.selectedID;
    //@ts-ignore
    const activeArea = copyToolInstance?.activeArea;
    if (activeId && imgList && imgList.length > imgIndex) {
      const toolInfoStr = localStorage.getItem('toolInfo');
      if (toolInfoStr && toolInfoStr.length > 0) {
        let imgResult = JSON.parse(imgList[imgIndex].result as string);
        for (let item of imgResult[currentToolName]?.result) {
          if (item.id === activeId) {
            setActiveOrder(item.order);
          }
        }
      }
    } else {
      setActiveOrder(0);
    }
    // @ts-ignore
  }, [copyToolInstance, currentToolName]);

  useEffect(() => {
    if (imgList && imgList.length > 0 && imgList.length > imgIndex) {
      let currentImgResult = JSON.parse(imgList[imgIndex].result as string);
      let resultKeys = Object.keys(currentImgResult);
      let tmpAttributeResult: AttributeResult[] = [];
      let attributeMap = new Map();
      for (let item of toolList) {
        if (resultKeys.indexOf(item.toolName) >= 0 && item.toolName !== 'tagTool') {
          let result = currentImgResult[item.toolName].result;
          if (result && Array.isArray(result)) {
            for (let oneLabel of result) {
              // eslint-disable-next-line max-depth
              let isExistInTmpToolInfo = false;
              if (attributeMap.has(oneLabel.attribute)) {
                let tmpToolInfo = attributeMap.get(oneLabel.attribute);
                // ??????
                for(let i=0;i<tmpToolInfo.length;i++){
                  if(tmpToolInfo[i].order === oneLabel.order){
                    isExistInTmpToolInfo = true;
                  }
                }

                if(!isExistInTmpToolInfo){
                  tmpToolInfo.push({
                    toolName: item.toolName,
                    order: oneLabel.order,
                    icon: item.commonSvg,
                    isVisible: oneLabel.isVisible,
                    textAttribute: oneLabel.textAttribute,
                  });
                }
   
              } else {
                attributeMap.set(oneLabel.attribute, [
                  {
                    toolName: item.toolName,
                    order: oneLabel.order,
                    icon: item.commonSvg,
                    isVisible: oneLabel.isVisible,
                    textAttribute: oneLabel.textAttribute,
                  },
                ]);
              }
            }
          }
        }
      }
      // ?????????attributeResultList
      for (let key of attributeMap.keys()) {
        let toolInfo = attributeMap.get(key);
        let isVisible = false;
        if (toolInfo && toolInfo.length > 0) {
          for (let tool of toolInfo) {
            if (tool.isVisible) {
              isVisible = true;
              break;
            }
          }
        }
        tmpAttributeResult.push({
          isVisible: isVisible,
          attributeName: key,
          toolInfo: attributeMap.get(key),
        });
      }
      console.log("???????????????")
      console.log(tmpAttributeResult)
      

      setAttributeResultList(tmpAttributeResult);
    }
  }, [imgList, imgIndex]);

  // ???????????????????????? || ????????????????????????
  const updateLabelResult = (toolInfo: ToolInfo) => {
    if (imgList && imgList.length > 0 && imgList.length > imgIndex) {
      let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      // ????????????
      if (
        oldImgResult[toolInfo.toolName].result &&
        oldImgResult[toolInfo.toolName].result.length > 0
      ) {
        let newToolLabelItems = oldImgResult[toolInfo.toolName].result.map(
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

  // ??????????????????????????????
  const updateLabelsResult = (attributeResult: AttributeResult) => {
    let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    // ??????????????????
    let newToolInfo: ToolInfo[] = [];
    if (attributeResult.toolInfo.length > 0) {
      newToolInfo = attributeResult.toolInfo.map((item) => {
        return { ...item, isVisible: attributeResult.isVisible };
      });
    }
    attributeResult.toolInfo = newToolInfo;
    const newAttributeResultList = attributeResultList.map((item, index) => {
      if (item.attributeName === attributeResult.attributeName) {
        return { ...attributeResult };
      }
      return item;
    });
    setAttributeResultList(newAttributeResultList);
    // ??????????????????
    if (attributeResult.toolInfo && attributeResult.toolInfo.length > 0) {
      for (let oneTool of attributeResult.toolInfo) {
        if (
          oldImgResult[oneTool.toolName].result &&
          oldImgResult[oneTool.toolName].result.length > 0
        ) {
          let newToolLabelItems = oldImgResult[oneTool.toolName].result.map(
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

  // ??????????????????
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
      // ????????????????????????order ??????
      const deleteResult = attributeResult.toolInfo
        .map((item) => {
          return item.order;
        })
        .sort((a, b) => a - b);

      let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      let newImgResult = { ...oldImgResult };
      // ????????????????????????
      let keys = Object.keys(oldImgResult);
      let toolList = keys.filter((item) => {
        return LableTools.indexOf(item as EToolName) >= 0;
      });

      for (let i = 0; i < toolList.length; i++) {
        newImgResult[toolList[i]].result = oldImgResult[toolList[i]].result.reduce(
          (
            res: { order: number; isVisible: boolean }[],
            item: { order: number; isVisible: boolean },
          ) => {
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

  // ????????????
  const delelteLabel = (toolInfo: ToolInfo) => {
    let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    let newImageResult = { ...oldImgResult };
    // ????????????
    if (
      oldImgResult[toolInfo.toolName].result &&
      oldImgResult[toolInfo.toolName].result.length > 0
    ) {
      // ????????????????????????
      let keys = Object.keys(oldImgResult);
      let toolList = keys.filter((item) => {
        return LableTools.indexOf(item as EToolName) >= 0;
      });

      for (let i = 0; i < toolList.length; i++) {
        newImageResult[toolList[i]].result = oldImgResult[toolList[i]].result.reduce(
          (
            res: { order: number; isVisible: boolean }[],
            item: { order: number; isVisible: boolean },
          ) => {
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

  // ??????pre ????????????
  const updateCanvasView = (newLabelResult: any) => {
    const prevResult: PrevResult[] = [];
    for (let oneTool of toolList) {
      if (oneTool.toolName !== currentToolName && newLabelResult[oneTool.toolName]) {
        let onePrevResult = {
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

  // ????????????????????? ?????????????????????
  const updateLabelResultByOrderAndToolName = (
    order: number,
    fromToolName: string,
    toAttributeName: string,
    toAttributeText: string,
  ) => {
    let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    // ????????????
    if (oldImgResult[fromToolName].result && oldImgResult[fromToolName].result.length > 0) {
      let newToolLabelItems = oldImgResult[fromToolName].result.map(
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

  // ??????????????????
  const setSelectedLabel = (toolInfo: ToolInfo) => {
    // ??????????????????
    let toolInfoStr = JSON.stringify(toolInfo);
    localStorage.setItem('toolInfo', toolInfoStr);
    // ????????????
    dispatch(ChangeCurrentTool(toolInfo.toolName));
    setChooseToolInfo(toolInfo);
  };

  useEffect(() => {
    if (imgList && basicResultList && imgList.length > imgIndex) {
      const toolInfoStr = localStorage.getItem('toolInfo');
      // ??????basicReuslt ????????????????????????
      const basicResultTools = basicResultList.reduce((res, item: { toolName: string }) => {
        res.push(item.toolName);
        return res;
      }, [] as string[]);

      if (toolInfoStr && toolInfoStr.length > 0) {
        const chooseToolInfo = JSON.parse(toolInfoStr as string);
        let imgResult = JSON.parse(imgList[imgIndex].result as string);
        if (
          toolInstance &&
          chooseToolInfo.toolName &&
          chooseToolInfo.toolName === currentToolName &&
          basicResultTools.indexOf(chooseToolInfo.toolName) < 0 &&
          imgResult[chooseToolInfo.toolName].result &&
          imgResult[chooseToolInfo.toolName].result.length > 0
        ) {
          for (let item of imgResult[chooseToolInfo.toolName].result) {
            if (item.order === chooseToolInfo.order) {
              // eslint-disable-next-line max-depth
              if (chooseToolInfo.toolName === EToolName.Line) {
                // @ts-ignore
                toolInstance?.setActiveAreaByPoint(item?.pointList[0]);
                // ??????????????????????????????
                initToolInfo();
              } else if (chooseToolInfo.toolName === EToolName.Point) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // ??????????????????????????????
                initToolInfo();
              } else if (chooseToolInfo.toolName === EToolName.Polygon) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // ??????????????????????????????
                initToolInfo();
              } else if (chooseToolInfo.toolName === EToolName.Rect) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // ??????????????????????????????
                initToolInfo();
              }
            }
          }
        }
      }
    }
  }, [toolInstance, basicResultList, chooseToolInfo]);

  const defaultKeys = useMemo(() => {
    let keys = attributeResultList.map((attribute, index) => {
      return attribute.attributeName;
    });
    return keys;
  }, [attributeResultList]);

  const generateContent = (toolInfo: ToolInfo, attributeResult: AttributeResult) => {
    let children = [];
    for (let item of attributeList) {
      // eslint-disable-next-line react/jsx-no-undef
      children.push(<Option key={item.key}>{item.value}</Option>);
    }
    children.push(<Option key={'?????????'}>?????????</Option>)
    return (
      <Form
        name='basic'
        layout='vertical'
        key={new Date().getTime()}
        initialValues={{
          changeAttribute: attributeResult.attributeName,
          description: toolInfo.textAttribute,
        }}
        autoComplete='off'
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
          label='??????'
          name='changeAttribute'
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            value={attributeResult.attributeName}
            style={{
              width: '100%',
            }}
          >
            {children}
          </Select>
        </Form.Item>
        <Form.Item
          label='??????'
          name='description'
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

  if (!attributeResultList || attributeResultList.length === 0) {
    return (
      <div className='containerBox'>
        <img className='emptyAttributeImg' src={emptyAttributeImg} />
      </div>
    );
  }

  return (
    <div
      className={classNames({
        attributeResult: true,
        attributeResultPreview: isPreview,
      })}
    >
      <DrageModel
        title='????????????'
        ref={dragModalRef}
        width={333}
        okWord='??????'
        cancelWord='??????'
        content={content}
      />
      <Collapse
        key={defaultKeys.join('')}
        defaultActiveKey={defaultKeys}
        expandIcon={expandIconFuc}
      >
        {attributeResultList &&
          attributeResultList.length > 0 &&
          attributeResultList.map((item, index) => {
            return (
              <Panel
                header={
                  <div className='attributeResultLi'>
                    <span
                      title={item.attributeName}
                      style={{
                        marginRight: '36px',
                        width: '84px',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      {item.attributeName}
                    </span>{' '}
                    <div className='attributeResultRightImgBox'>
                      {item.isVisible ? (
                        <img
                          className='hoverShow'
                          id={`${item.attributeName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateLabelsResult({ ...item, isVisible: false });
                            // const newTItem = { ...item, isVisible: false };
                            // updateLabelVisible(tItem, false);
                            // updateLabelResult(newTItem);
                          }}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            // attributeShowRef.current?.setAttribute('src', AttributeShowHoverIcon);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            // attributeShowRef.current?.setAttribute('src', AttributeShowIcon);
                          }}
                          src={AttributeShowIcon}
                          style={{ marginRight: '10px' }}
                        />
                      ) : (
                        <img
                          onClick={(e) => {
                            e.stopPropagation();
                            updateLabelsResult({ ...item, isVisible: true });
                            // updateLabelVisible(tItem, true);
                          }}
                          src={AttributeHideIcon}
                          style={{ marginRight: '10px' }}
                        />
                      )}
                      <img
                        src={AttributeUnionIcon}
                        className='hoverShow'
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
                  item.toolInfo.map((tItem, tIndex) => {
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
                          setSelectedLabel(tItem);
                        }}
                      >
                        <span>{tItem.order}.</span>
                        <img src={tItem.icon} style={{ marginLeft: '5px', marginRight: '5px' }} />
                        <span
                          title={item.attributeName}
                          style={{
                            marginRight: '36px',
                            width: '84px',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                          }}
                        >
                          {item.attributeName}
                        </span>
                        <div className='attributeResultRightImgBox'>
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
                            className='hoverShow'
                            style={{ left: 10, position: 'absolute' }}
                          />
                          {tItem.isVisible ? (
                            <img
                              className='hoverShow'
                              id={`${tItem.toolName + tItem.order}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newTItem = { ...tItem, isVisible: false };
                                // updateLabelVisible(tItem, false);
                                updateLabelResult(newTItem);
                              }}
                              // onMouseEnter={(e) => {
                              //   e.stopPropagation();
                              //   document
                              //     .getElementById(`${tItem.toolName + tItem.order}`)
                              //     ?.setAttribute('src', AttributeShowHoverIcon);

                              // }}
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
                            className='hoverShow'
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
    </div>
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
