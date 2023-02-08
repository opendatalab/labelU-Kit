import React, { FC, ReactElement, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Collapse } from 'antd';
import { AppState } from '../../../../store';
import { connect } from 'react-redux';
import { useDispatch } from '@/store/ctx';
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
import { Attribute, EToolName } from '@label-u/annotation';
import DrageModel from '@/components/dragModal';
import classNames from 'classnames';
import { expandIconFuc } from '../TagSidebar';
import { LabelUContext } from '@/store/ctx';
import { PointCloudContext } from '@/components/pointCloudView/PointCloudContext';
import { useAttributes } from '../../../hooks/useAttribute';

const { Panel } = Collapse;

const LableTools = [
  EToolName.Rect,
  EToolName.Point,
  EToolName.Line,
  EToolName.Polygon,
  EToolName.pointCloud,
];

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
  attributeList: Attribute[];
  imgIndex: number;
  imgList: IFileItem[];
  toolInstance: ToolInstance;
  copyToolInstance: ToolInstance;
  currentToolName: string;
  basicResultList: [];
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
  const ptCtx = useContext(PointCloudContext);

  const {generateContent,updateCanvasView} = useAttributes();
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

  // 工具选中后联动标注结果选中项
  useEffect(() => {
    let activeId =
      currentToolName === EToolName.Rect
        ? // @ts-ignore
          copyToolInstance?.selectedRectID
        : // @ts-ignore
          copyToolInstance?.selectedID;
    if (currentToolName === 'pointCloudTool') {
      activeId = ptCtx.selectedID;
    }

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
  }, [copyToolInstance, currentToolName, ptCtx.selectedID]);

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
              if (attributeMap.has(oneLabel.attribute)) {
                let tmpToolInfo = attributeMap.get(oneLabel.attribute);
                tmpToolInfo.push({
                  toolName: item.toolName,
                  order: oneLabel.order,
                  icon: item.commonSvg,
                  isVisible: oneLabel.isVisible,
                  textAttribute: oneLabel.textAttribute,
                });
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
      // 初始化attributeResultList
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
      setAttributeResultList(tmpAttributeResult);
    }
  }, [imgList, imgIndex]);

  // 修改标注描述信息 || 修改是否可以显示
  const updateLabelResult = (toolInfo: ToolInfo) => {
    if (imgList && imgList.length > 0 && imgList.length > imgIndex) {
      let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      // 更新结果
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
      setTimeout(() => {
        ptCtx?.mainViewInstance?.emit('refreshPointCloud3dView');
      }, 100);
      updateCanvasView(oldImgResult);
    }
  };

  // 批量修改是否可以显示
  const updateLabelsResult = (attributeResult: AttributeResult) => {
    let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    // 更新标注结果
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
    // 更新显示结果
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
      setTimeout(() => {
        ptCtx?.mainViewInstance?.emit('refreshPointCloud3dView');
      }, 100);
      updateCanvasView(oldImgResult);
    }
  };

  // 批量删除标注
  const deleteLabelByAttribute = (attributeResult: AttributeResult) => {
    let deleteBoxArray: string[] = [];
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

      let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      let newImgResult = { ...oldImgResult };
      // 获取已用工具列表
      let keys = Object.keys(oldImgResult);
      let toolList = keys.filter((item) => {
        return LableTools.indexOf(item as EToolName) >= 0;
      });

      for (let i = 0; i < toolList.length; i++) {
        newImgResult[toolList[i]].result = oldImgResult[toolList[i]].result.reduce(
          (
            res: { order: number; isVisible: boolean; id?: string }[],
            item: { order: number; isVisible: boolean; id?: string },
          ) => {
            if (deleteResult.indexOf(item.order) < 0) {
              item.order = item.order - getPositionIndexInArr(deleteResult, item.order);
              res.push(item);
            } else {
              item.id ? deleteBoxArray.push(item.id) : '';
            }
            return res;
          },
          [],
        );
      }
      imgList[imgIndex].result = JSON.stringify(newImgResult);
      dispatch(UpdateImgList(imgList));
      setTimeout(() => {
        ptCtx?.mainViewInstance?.emit('deleteBoxes', deleteBoxArray);
      }, 100);
      updateCanvasView(newImgResult);
    }
  };

  // 删除标注
  const delelteLabel = (toolInfo: ToolInfo) => {
    let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    let newImageResult = { ...oldImgResult };
    let deleteBoxArray: string[] = [];
    // 更新结果
    if (
      oldImgResult[toolInfo.toolName].result &&
      oldImgResult[toolInfo.toolName].result.length > 0
    ) {
      // 获取已用工具列表
      let keys = Object.keys(oldImgResult);
      let toolList = keys.filter((item) => {
        return LableTools.indexOf(item as EToolName) >= 0;
      });
      for (let i = 0; i < toolList.length; i++) {
        newImageResult[toolList[i]].result = oldImgResult[toolList[i]].result.reduce(
          (
            res: { order: number; isVisible: boolean; id?: string }[],
            item: { order: number; isVisible: boolean; id?: string },
          ) => {
            if (item.order !== toolInfo.order) {
              if (item.order > toolInfo.order) {
                item.order = item.order - 1;
              }
              res.push(item);
            } else {
              item?.id ? deleteBoxArray.push(item.id) : '';
            }
            return res;
          },
          [],
        );
      }
    }
    imgList[imgIndex].result = JSON.stringify(newImageResult);
    dispatch(UpdateImgList(imgList));
    setTimeout(() => {
      ptCtx?.mainViewInstance?.emit('deleteBoxes', deleteBoxArray);
    }, 100);
    updateCanvasView(newImageResult);
  };

  // 设置选中项
  const setSelectedLabel = (toolInfo: ToolInfo) => {
    // 选中当前标注
    let toolInfoStr = JSON.stringify(toolInfo);
    localStorage.setItem('toolInfo', toolInfoStr);
    setChooseToolInfo(toolInfo);
    // 切换工具
    if (currentToolName !== 'pointCloudTool') {
      dispatch(ChangeCurrentTool(toolInfo.toolName));
    } else {
      ptCtx?.mainViewInstance?.emit('setSelectedBoxByOrder', toolInfo.order);
    }
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
                // 选中之后，重新初始化
                initToolInfo();
              } else if (chooseToolInfo.toolName === EToolName.Point) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // 选中之后，重新初始化
                initToolInfo();
              } else if (chooseToolInfo.toolName === EToolName.Polygon) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // 选中之后，重新初始化
                initToolInfo();
              } else if (chooseToolInfo.toolName === EToolName.Rect) {
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
  }, [toolInstance, basicResultList, chooseToolInfo]);

  const defaultKeys = useMemo(() => {
    let keys = attributeResultList.map((attribute, index) => {
      return attribute.attributeName;
    });
    return keys;
  }, [attributeResultList]);

  if (!attributeResultList || attributeResultList.length === 0) {
    return (
      <div className='containerBox'>
        <img className='emptyAttributeImg' src={emptyAttributeImg} />
      </div>
    );
  }

  return (
    <div className='attributeResult'>
      <DrageModel
        title='详细信息'
        ref={dragModalRef}
        width={333}
        okWord='确认'
        cancelWord='取消'
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
    attributeList: state.annotation.attributeList,
    basicResultList: state.annotation.basicResultList,
  };
};

export default connect(getStateMap, null, null, { context: LabelUContext })(AttributeRusult);
