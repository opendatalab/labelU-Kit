import { Attribute, EToolName, OneTag } from '@label-u/annotation';
import { BasicConfig, TextConfig } from '@label-u/components';
import { Button, Dropdown, Form, Menu, Select, Tabs } from 'antd';
import React, { FC, useEffect, useMemo, useState } from 'react';
import '../index.less';
import { toolnames, types, toolnameT } from './constants';
import FormEngine from './formEngine';
import CommonFormItem from '../components/commonFormItems';
import { useSelector } from 'react-redux';
const { Option } = Select;

const FormConfig: FC = props => {
  // const [tools, setTools] = useState<BasicConfig[]>([]);
  //   const [tagList, setTagList] = useState<OneTag[]>([]);
  //   const [attribute, setAttribute] = useState<Attribute[]>([]);
  //   const [textConfig, setTextConfig] = useState<TextConfig>([]);
  const { tools, tagList, attribute, textConfig } = useSelector(state => state.toolsConfig);
  const children = [];
  const [media, setMedia] = useState<string>();
  const [selectTools, setSelectTools] = useState<string[]>([]);
  const [curentTool, setCurrentTool] = useState<string>();

  for (let i = 0; i < types.length; i++) {
    children.push(<Option key={types[i]}>{types[i]}</Option>);
  }

  const items = useMemo(() => {
    let items = [];
    for (let i = 0; i < toolnames.length; i++) {
      if (selectTools.indexOf(toolnames[i]) < 0) {
        items.push({
          key: toolnameT[toolnames[i]],
          label: (
            <div
              onClick={e => {
                updateSelectTools(toolnameT[toolnames[i]]);
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
  }, [curentTool]);

  useEffect(() => {
    let toolArr = [];
    if (tools.length > 0) {
      for (let i = 0; i < tools.length; i++) {
        if (selectTools.indexOf(tools[i].tool) < 0) {
          toolArr.push(tools[i].tool);
        }
      }
      setSelectTools(toolArr);
      setCurrentTool(toolArr[toolArr.length - 1]);
    }
  }, [tools]);

  const updateSelectTools = (toolname: string) => {
    let tmp = selectTools;
    if (tmp.indexOf(toolname) >= 0) {
      tmp.splice(tmp.indexOf(toolname), 1);
    } else {
      tmp.push(toolname);
      setCurrentTool(toolname);
    }
    setSelectTools(tmp);
  };

  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    let leftSiderDom = document.getElementById('lefeSiderId');
    let height = leftSiderDom?.getBoundingClientRect().height as number;
    setHeight(height - 78);
  }, []);

  const handleChange = (e: React.SetStateAction<string | undefined>) => {
    setMedia(e);
    console.log(e);
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
      {selectTools && selectTools.length > 0 && (
        <div className="formTabBox">
          <Tabs
            // onChange={onChange}
            type="card"
            items={selectTools.map((_, i) => {
              const id = String(i + 1);
              // 配置初始化
              let initC = {} as BasicConfig;
              let configArr = [];
              configArr = tools.filter(item => {
                return item.tool === _;
              });
              initC = configArr[0];

              return {
                label: `${_}`,
                key: id,
                children: (
                  <div className="toolConfigPane">
                    <Form.Provider
                      onFormChange={(name, info) => {
                        // todo 统一处理表单 和  标注工具之间联动
                        console.log(name);
                        console.log(info.forms[name].getFieldsValue());
                        console.log(_);
                      }}
                    >
                      {<FormEngine toolname={_} config={initC} />}
                      <CommonFormItem />
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
