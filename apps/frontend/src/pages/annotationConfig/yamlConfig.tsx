import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-xcode';
import 'ace-builds/src-noconflict/snippets/json';
import 'ace-builds/src-min-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/webpack-resolver';
import _ from 'lodash';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ToolsConfigState } from '@/types/toolConfig';

import jsonToyam from '../../utils/jsonToyml';
import ConfigNotMatchImg from '../../img/annotationCommon/configNotMatch.png';
import {
  updateAllAttributeConfigList,
  updateTagConfigList,
  updateTextConfig,
  updateToolsConfig,
} from '../../stores/toolConfig.store';
import { compare } from '../../utils';
import { validateTools } from '../../utils/tool/common';

interface YamlConfigProps {
  toolsConfigState: ToolsConfigState;
  doSetImg: (img: any, isError: boolean) => void;
}

const YamlConfig: FC<YamlConfigProps> = (props) => {
  const [xmlValue, setXmlValue] = useState<string>('');
  const dispatch = useDispatch();
  // @ts-ignore
  const { tools, tagList, attribute, textConfig } = useSelector((state) => state.toolsConfig);
  const onLoad = () => {};

  useEffect(() => {
    let tmpStepConfig = {};
    const keys: string[] = Object.keys(props.toolsConfigState);
    for (let i = 0; i < keys.length; i++) {
      if (
        // @ts-ignore
        props.toolsConfigState[keys[i]] &&
        // @ts-ignore
        ((Array.isArray(props.toolsConfigState[keys[i]]) && props.toolsConfigState[keys[i]].length > 0) ||
          // @ts-ignore
          (!Array.isArray(props.toolsConfigState[keys[i]]) &&
            // @ts-ignore
            Object.keys(props.toolsConfigState[keys[i]]) &&
            // @ts-ignore
            Object.keys(props.toolsConfigState[keys[i]]).length > 0))
      ) {
        // @ts-ignore
        tmpStepConfig = { ...tmpStepConfig, [keys[i]]: props.toolsConfigState[keys[i]] };
      }
    }
    const jsonToyamUtil = new jsonToyam();
    const yml = jsonToyamUtil.json2yaml(tmpStepConfig);
    setXmlValue(yml);
  }, [props.toolsConfigState]);

  const [aceHeight, setAceHeight] = useState<number>(0);
  const [aceWidth, setAceWidth] = useState<number>(0);

  useEffect(() => {
    const leftSiderDom = document.getElementById('lefeSiderId');
    const height = leftSiderDom?.getBoundingClientRect().height as number;
    const width = leftSiderDom?.getBoundingClientRect().width as number;
    setAceHeight(height - 105);
    setAceWidth(width - 50);
  }, []);

  // 触发工具配置更新
  const onAceBlur = (e: React.FocusEvent<HTMLInputElement, Element>) => {
    e.stopPropagation();
    try {
      const initConfig = {
        tools: [],
        tagList: [],
        attribute: [],
        textConfig: [],
      };
      // @ts-ignore
      const yamlConfigs = window.YAML.parse(xmlValue);
      // 清空配置
      const configs = {
        ...initConfig,
        ...yamlConfigs,
      };
      const keys = Object.keys(configs);
      for (const key of keys) {
        if (key === 'attribute' && !compare(configs[key], attribute)) {
          dispatch(updateAllAttributeConfigList(configs[key]));
        } else if (key === 'tagList' && !compare(configs[key], tagList)) {
          dispatch(updateTagConfigList(configs[key]));
        } else if (key === 'textConfig' && !compare(configs[key], textConfig)) {
          dispatch(updateTextConfig(configs[key]));
        } else if (key === 'tools' && !compare(configs[key], tools)) {
          if (!validateTools(configs[key])) {
            props.doSetImg(ConfigNotMatchImg, true);
          } else {
            props.doSetImg(ConfigNotMatchImg, false);
          }
          dispatch(updateToolsConfig(configs[key]));
        }
      }
    } catch (error) {
      props.doSetImg(ConfigNotMatchImg, true);
    }
  };

  const onChnageAce = _.debounce((e: any) => {
    setXmlValue(e);
  }, 10);

  return (
    <>
      <AceEditor
        placeholder="请输入工具配置（yaml格式）"
        mode="json"
        theme="xcode"
        name="github"
        width={aceWidth + 'px'}
        height={aceHeight + 'px'}
        onLoad={onLoad}
        onChange={onChnageAce}
        onBlur={onAceBlur}
        fontSize={14}
        showPrintMargin={true}
        showGutter={true}
        highlightActiveLine={true}
        wrapEnabled={true}
        value={xmlValue}
        editorProps={{ $blockScrolling: Infinity }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
          readOnly: true,
        }}
      />
    </>
  );
};

export default YamlConfig;
