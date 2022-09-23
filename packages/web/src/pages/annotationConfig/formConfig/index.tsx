import { Attribute, OneTag } from '@label-u/annotation';
import { BasicConfig, TextConfig } from '@label-u/components';
import { Button, Dropdown, Menu, Select, Tabs } from 'antd';
import React, { FC, useEffect, useMemo, useState } from 'react';
import '../index.less';
import { toolnames, types } from './constants';
import FormEngine from './formEngine';
// import { useSelector } from 'react-redux';
const { Option } = Select;

const FormConfig: FC = props => {
    const [tools, setTools] = useState<BasicConfig[]>([]);
  //   const [tagList, setTagList] = useState<OneTag[]>([]);
  //   const [attribute, setAttribute] = useState<Attribute[]>([]);
  //   const [textConfig, setTextConfig] = useState<TextConfig>([]);
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
          key: toolnames[i],
          label: (
            <div
              onClick={e => {
                updateSelectTools(toolnames[i]);
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
    debugger;
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
              return {
                label: `${_}`,
                key: id,
                children: (
                  <div className="toolConfigPane">
                    <FormEngine toolname={_} config={tools[0]} />
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
