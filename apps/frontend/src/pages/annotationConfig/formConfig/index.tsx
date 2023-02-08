import type { OneTag } from '@label-u/annotation';
import { EToolName } from '@label-u/annotation';
import type { BasicConfig } from '@label-u/components';
import { Button, Dropdown, Form, Menu, Select, Tabs } from 'antd';
import type { FC, Dispatch, SetStateAction } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ToolsConfigState } from '@/types/toolConfig';

import { toolnames, types, toolnameT, toolnameC } from './constants';
import FormEngine from './formEngine';
import CommonFormItem from '../components/commonFormItems';
import { LoadInitConfig } from '../configTemplate/config';
import {
  updateAllAttributeConfigList,
  updatecCommonAttributeConfigurable,
  updateTagConfigList,
  updateTextConfig,
  updateToolsConfig,
} from '../../../stores/toolConfig.store';
import '../index.less';
import { validateTools } from '../../../utils/tool/common';

const { Option } = Select;

const noCommonConfigTools = ['tagTool', 'textTool'];

// instead of useState
let activeTabKey = '1';

function setActiveTabKey(value: string) {
  activeTabKey = value;
}

interface IProps {
  config: ToolsConfigState;
  setConfig: Dispatch<SetStateAction<ToolsConfigState>>;
}

const FormConfig: FC<IProps> = () => {
  const { tools, tagList, attribute, textConfig, commonAttributeConfigurable } = useSelector(
    // @ts-ignore
    (state) => state.toolsConfig,
  );
  const dispatch = useDispatch();
  const children = [];
  const [media, setMedia] = useState<string>('图片');
  const [selectTools, setSelectTools] = useState<string[]>([]);
  // const [curentTool, setCurrentTool] = useState<string>();
  // const [activeTabKey, setActiveTabKey] = useState<string>("1");
  const [isConfigLoad, setIsConfigLoad] = useState<boolean>(true);
  for (let i = 0; i < types.length; i++) {
    children.push(<Option key={types[i]}>{types[i]}</Option>);
  }
  const [force, forceSet] = useState(0);

  const updateSelectTools = (toolname: string) => {
    const tmp = selectTools;
    if (tmp.indexOf(toolname) >= 0) {
      tmp.splice(tmp.indexOf(toolname), 1);
    } else {
      tmp.push(toolname);
    }
    setSelectTools(tmp);
  };

  const loadInitConfig = async (toolname: string, _tools: BasicConfig[]) => {
    setIsConfigLoad(false);
    await new Promise(async (resolve) => {
      if (toolname) {
        const config = await LoadInitConfig(toolname);
        const keys = Object.keys(config);
        for (const key of keys) {
          if (key === 'attribute' && attribute.length === 0) {
            dispatch(updateAllAttributeConfigList(config[key]));
          } else if (key === 'tagList' && tagList.length === 0) {
            dispatch(updateTagConfigList(config[key]));
          } else if (key === 'textConfig' && textConfig.length === 0) {
            dispatch(updateTextConfig(config[key]));
          } else if (key === 'tools') {
            const newTools = [..._tools].concat(config[key]);
            dispatch(updateToolsConfig(newTools));
          }
        }
        resolve(config);
      }
    });
    setIsConfigLoad(true);
  };

  const items = useMemo(() => {
    const _items = [];
    for (let i = 0; i < toolnames.length; i++) {
      if (selectTools.indexOf(toolnameT[toolnames[i]]) < 0) {
        _items.push({
          key: toolnameT[toolnames[i]],
          label: (
            <div
              onClick={(e) => {
                updateSelectTools(toolnameT[toolnames[i]]);
                loadInitConfig(toolnameT[toolnames[i]], tools);
                e.stopPropagation();
              }}
              style={{ paddingTop: 5, paddingBottom: 5, paddingLeft: 12 }}
            >
              <span>{toolnames[i]}</span>
            </div>
          ),
        });
      }
    }
    return _items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectTools, tools]);

  useEffect(() => {
    const toolArr = [];
    if (tools && tools.length > 0) {
      for (let i = 0; i < tools.length; i++) {
        if (selectTools.indexOf(tools[i].tool) < 0 && toolArr.indexOf(tools[i].tool) < 0) {
          toolArr.push(tools[i].tool);
        }
      }
      let newTools = [...selectTools].concat(toolArr);
      if (tagList.length === 0) {
        newTools = newTools.filter((tool) => {
          return tool !== EToolName.Tag;
        });
      }
      if (textConfig.length === 0) {
        newTools = newTools.filter((tool) => {
          return tool !== EToolName.Text;
        });
      }
      setSelectTools(newTools);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tools, tagList, textConfig]);

  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const leftSiderDom = document.getElementById('lefeSiderId');
    const _height = leftSiderDom?.getBoundingClientRect().height as number;
    setHeight(_height - 128);
  }, []);

  const handleChange = (e: React.SetStateAction<string>) => {
    setMedia(e);
  };

  const updateCombineToolsConfig = (_tools: BasicConfig[], config: Record<string, unknown>, toolname: string) => {
    const newTools = _tools.reduce((res, item) => {
      if (item.tool === toolname || toolname === 'commonForm') {
        const copyItem = { ...item };
        const newConfig = {
          ...copyItem.config,
          ...config,
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
      dispatch(updatecCommonAttributeConfigurable(info.values.commonAttributeConfigurable));
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
        <Dropdown overlay={<Menu items={items} />} placement="bottomLeft" trigger={['click']}>
          <Button type="primary" ghost>
            <span style={{ fontSize: 22, marginTop: -7 }}>+ </span> 新增工具
          </Button>
        </Dropdown>
      </div>
      {selectTools && selectTools.length > 0 && validateTools(tools) && (
        <div className="formTabBox">
          <Tabs
            type="card"
            activeKey={String(Math.min(Number(activeTabKey), selectTools.length))}
            onChange={(e) => {
              setActiveTabKey(e);
              forceSet(new Date().getTime());
            }}
            items={selectTools.map((_, i) => {
              const id = String(i + 1);
              // 配置初始化
              let initC = {} as BasicConfig;
              let configArr = [];
              let isShow = true;
              configArr = tools.filter((item: any) => {
                return item.tool === _;
              });
              initC = configArr[0];
              // 公共配置
              let commonConfig = {
                drawOutsideTarget: false,
                textCheckType: 1,
                customFormat: '',
                textConfigurable: false,
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
                    textConfigurable: initC.config.textConfigurable,
                  };
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
                          commonAttributeConfigurable={commonAttributeConfigurable}
                          attribute={attribute}
                          {...commonConfig}
                          name="commonForm"
                          toolName={_}
                          isShow={isShow}
                        />
                      )}
                    </Form.Provider>
                  </div>
                ),
              };
            })}
          />
        </div>
      )}
    </div>
  );
};

export default FormConfig;
