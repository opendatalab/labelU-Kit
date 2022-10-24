import { EToolName, OneTag } from '@label-u/annotation';
import { BasicConfig } from '@label-u/components';
import { Button, Dropdown, Form, Menu, Select, Tabs } from 'antd';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { toolnames, types, toolnameT, toolnameC } from './constants';
import FormEngine from './formEngine';
import CommonFormItem from '../components/commonFormItems';
import { useDispatch, useSelector } from 'react-redux';
import { LoadInitConfig } from '../configTemplate/config';
import {
  updateAllAttributeConfigList,
  updateFileInfo,
  updateTagConfigList,
  updateTextConfig,
  updateToolsConfig
} from '../../../stores/toolConfig.store';
import '../index.less';
import { validateTools } from '../../../utils/tool/common';
const { Option } = Select;

const noCommonConfigTools = ['tagTool', 'textTool'];
const nodrawOutsideTargetTools = ['lineTool'];

const FormConfig: FC = props => {
  const { tools, tagList, attribute, textConfig } = useSelector(state => state.toolsConfig);
  const dispatch = useDispatch();
  const children = [];
  const [media, setMedia] = useState<string>('图片');
  const [selectTools, setSelectTools] = useState<string[]>([]);
  // const [curentTool, setCurrentTool] = useState<string>();
  const [isConfigLoad, setIsConfigLoad] = useState<boolean>(true);
  for (let i = 0; i < types.length; i++) {
    children.push(<Option key={types[i]}>{types[i]}</Option>);
  }
  const [force, forceSet] = useState(0);
  const items = useMemo(() => {
    let items = [];
    for (let i = 0; i < toolnames.length; i++) {
      if (selectTools.indexOf(toolnameT[toolnames[i]]) < 0) {
        items.push({
          key: toolnameT[toolnames[i]],
          label: (
            <div
              onClick={e => {
                updateSelectTools(toolnameT[toolnames[i]]);
                loadInitConfig(toolnameT[toolnames[i]], tools);
                e.stopPropagation();
              }}
              style={{ paddingTop: 5, paddingBottom: 5, paddingLeft: 12 }}
            >
              <span>{toolnames[i]}</span>
            </div>
          )
        });
      }
    }
    return items;
  }, [selectTools, tools]);

  const loadInitConfig = async (toolname: string, tools: BasicConfig[]) => {
    setIsConfigLoad(false);
    await new Promise(async (resolve, reject) => {
      if (toolname) {
        const config = await LoadInitConfig(toolname);
        const keys = Object.keys(config);
        for (let key of keys) {
          if (key === 'attribute' && attribute.length === 0) {
            dispatch(updateAllAttributeConfigList(config[key]));
          } else if (key === 'tagList' && tagList.length === 0) {
            dispatch(updateTagConfigList(config[key]));
          } else if (key === 'textConfig' && textConfig.length === 0) {
            dispatch(updateTextConfig(config[key]));
          } else if (key === 'tools') {
            let newTools = [...tools].concat(config[key]);
            dispatch(updateToolsConfig(newTools));
          } else if (key === 'fileInfo') {
            dispatch(updateFileInfo(config[key]));
          }
        }
        resolve(config);
      }
    });
    setIsConfigLoad(true);
  };

  useEffect(() => {
    let toolArr = [];
    if (tools && tools.length > 0) {
      for (let i = 0; i < tools.length; i++) {
        if (selectTools.indexOf(tools[i].tool) < 0 && toolArr.indexOf(tools[i].tool) < 0) {
          toolArr.push(tools[i].tool);
        }
      }
      let newTools = [...selectTools].concat(toolArr);
      if (tagList.length === 0) {
        newTools = newTools.filter(tool => {
          return tool !== EToolName.Tag;
        });
      }
      if (textConfig.length === 0) {
        newTools = newTools.filter(tool => {
          return tool !== EToolName.Text;
        });
      }
      setSelectTools(newTools);
      // setCurrentTool(newTools[newTools.length - 1]);
    }
  }, [tools, tagList, textConfig]);

  const updateSelectTools = (toolname: string) => {
    let tmp = selectTools;
    if (tmp.indexOf(toolname) >= 0) {
      tmp.splice(tmp.indexOf(toolname), 1);
    } else {
      tmp.push(toolname);
      // setCurrentTool(toolname);
    }
    setSelectTools(tmp);
  };

  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    let leftSiderDom = document.getElementById('lefeSiderId');
    let height = leftSiderDom?.getBoundingClientRect().height as number;
    setHeight(height - 178);
  }, []);

  const handleChange = (e: React.SetStateAction<string>) => {
    setMedia(e);
  };

  const updateCombineToolsConfig = (tools: BasicConfig[], config: object, toolname: string) => {
    let newTools = tools.reduce((res, item) => {
      if (item.tool === toolname || toolname === 'commonForm') {
        let copyItem = { ...item };
        let newConfig = {
          ...copyItem.config,
          ...config
        };
        copyItem.config = newConfig;
        res.push(copyItem);
      } else {
        res.push(item);
      }
      return res;
    }, [] as BasicConfig[]);
    dispatch(updateToolsConfig(newTools));
  };

  const actUpdateToolsConfig = (name: string, info: any) => {
    if (name && Object.keys(toolnameC).indexOf(name) >= 0) {
      if (name === 'tagTool') {
        dispatch(updateTagConfigList(info.values.tagList as OneTag[]));
      } else if (name === 'textTool') {
        dispatch(updateTextConfig(info.values.textConfig));
      } else {
        updateCombineToolsConfig(tools, info.values, name);
      }
    }
    if (name === 'commonForm') {
      if (info.values.attribute !== undefined) {
        dispatch(updateAllAttributeConfigList(info.values.attribute));
      }
      let commonToolConfig = {};
      if (info.values.drawOutsideTarget !== undefined) {
        commonToolConfig = Object.assign(commonToolConfig, { drawOutsideTarget: info.values.drawOutsideTarget });
      }
      if (info.values.textConfigurableContext !== undefined) {
        commonToolConfig = Object.assign(commonToolConfig, info.values.textConfigurableContext);
      }
      updateCombineToolsConfig(tools, commonToolConfig, name);
    }
  };
  return (
    <div className="formConfig" style={{ height: height }}>
      <div className="oneRow">
        <label>标注类型</label>
        <Select size="middle" value={media} onChange={handleChange} listItemHeight={10} listHeight={250}>
          {children}
        </Select>
      </div>
      <div className="oneRow">
        <label>标注工具</label>
        <Dropdown overlay={<Menu items={items}></Menu>} placement="bottomLeft" trigger={['click']}>
          <Button type="primary" ghost>
            新增标注工具 +
          </Button>
        </Dropdown>
      </div>
      {selectTools && selectTools.length > 0 && validateTools(tools) && (
        <div className="formTabBox">
          <Tabs
            // onChange={onChange}
            type="card"
            activeKey={
              // fix: 未初始化tab切换页面
              (localStorage.getItem('activeTabKeys') &&
              Number(localStorage.getItem('activeTabKeys')) <= selectTools.length
                ? localStorage.getItem('activeTabKeys')
                : selectTools.length + '') as string
            }
            onChange={e => {
              localStorage.setItem('activeTabKeys', e);
              forceSet(new Date().getTime());
            }}
            items={selectTools.map((_, i) => {
              const id = String(i + 1);
              // 配置初始化
              let initC = {} as BasicConfig;
              let configArr = [];
              let isShow = true;
              configArr = tools.filter(item => {
                return item.tool === _;
              });
              initC = configArr[0];
              // 公共配置
              let commonConfig = {
                drawOutsideTarget: false,
                textCheckType: 1,
                customFormat: '',
                textConfigurable: true
              };

              if (noCommonConfigTools.indexOf(_) >= 0) {
                //@ts-ignore
                isShow = false;
              } else {
                if (initC && initC.config) {
                  commonConfig = {
                    //@ts-ignore
                    drawOutsideTarget: initC.config.drawOutsideTarget,
                    //@ts-ignore
                    textCheckType: initC.config.textCheckType,
                    //@ts-ignore
                    customFormat: initC.config.customFormat,
                    //@ts-ignore
                    textConfigurable: initC.config.textConfigurable
                  };
                  if (nodrawOutsideTargetTools.indexOf(_) >= 0) {
                    //@ts-ignore
                    delete commonConfig['drawOutsideTarget'];
                  }
                }
              }

              return {
                //@ts-ignore
                label: `${toolnameC[_]}`,
                key: id,
                children: (
                  <div className="toolConfigPane">
                    <Form.Provider
                      onFormFinish={(name, info) => {
                        if (Object.keys(info.forms).length > 0) {
                          // todo 统一处理表单 和  标注工具之间联动
                          actUpdateToolsConfig(name, info);
                        }
                      }}
                    >
                      {<FormEngine toolname={_} config={initC} />}

                      {isConfigLoad && (
                        <CommonFormItem
                          key={force}
                          commonAttributeConfigurable={attribute.length > 0}
                          attribute={attribute}
                          {...commonConfig}
                          name="commonForm"
                          toolName={_}
                          isShow={isShow}
                        />
                      )}
                    </Form.Provider>
                  </div>
                )
              };
            })}
          />
        </div>
      )}
    </div>
  );
};

export default FormConfig;
