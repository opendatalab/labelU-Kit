import type { FC } from 'react';
import React from 'react';
import { useDispatch } from 'react-redux';

import {
  updateAllAttributeConfigList,
  updateTagConfigList,
  updateTextConfig,
  updateToolsConfig,
} from '../../../../../stores/toolConfig.store';
export interface Item {
  img: any;
  tmplateName: string;
  label: string;
}
interface Iprops {
  tempaltes: Item[];
  hideBox: () => void;
}

const TmplateBox: FC<Iprops> = ({ tempaltes, hideBox }) => {
  const dispatch = useDispatch();
  const updateToolConfig = (item: Item) => {
    if (typeof item.tmplateName === 'object' && !Array.isArray(item.tmplateName)) {
      const initConfig = {
        tools: [],
        tagList: [],
        attribute: [],
        textConfig: [],
        // @ts-ignore
        ...item.tmplateName,
      };
      // 配置设置
      const keys = Object.keys(initConfig);
      for (const key of keys) {
        if (key === 'attribute') {
          dispatch(updateAllAttributeConfigList(initConfig[key]));
        } else if (key === 'tagList') {
          dispatch(updateTagConfigList(initConfig[key]));
        } else if (key === 'textConfig') {
          dispatch(updateTextConfig(initConfig[key]));
        } else if (key === 'tools') {
          dispatch(updateToolsConfig(initConfig[key]));
        }
      }
    }
  };

  return (
    <div className="tabContentBox">
      {tempaltes.map((item) => {
        return (
          <div
            key={item.label}
            className="imgBox"
            onDoubleClick={() => {
              updateToolConfig(item);
              hideBox();
            }}
          >
            <img alt={item.label} src={item.img} />
            <p>{item.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default TmplateBox;
