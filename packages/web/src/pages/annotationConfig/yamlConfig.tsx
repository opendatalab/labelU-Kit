import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-xcode';
import 'ace-builds/src-noconflict/snippets/json';
import 'ace-builds/src-min-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/webpack-resolver';
import _ from 'lodash';
import { FC, useEffect, useState } from 'react';
import { ToolsConfigState } from 'interface/toolConfig';
import { message } from 'antd';
import jsonToyam from '../../utils/jsonToyml';
import { useDispatch, useSelector } from 'react-redux';
import ConfigNotMatchImg from '../../img/annotationCommon/configNotMatch.png';
// import YAML from 'yaml';
import {
  updateAllAttributeConfigList,
  updateFileInfo,
  updateTagConfigList,
  updateTextConfig,
  updateToolsConfig
} from '../../stores/toolConfig.store';
import { compare } from '../../utils';

interface YamlConfigProps {
  toolsConfigState: ToolsConfigState;
  doSetImg: (img: any) => void;
}

const YamlConfig: FC<YamlConfigProps> = props => {
  const [xmlValue, setXmlValue] = useState<string>('');
  const dispatch = useDispatch();
  const { tools, tagList, attribute, textConfig } = useSelector(state => state.toolsConfig);
  const onLoad = () => {
    console.log('load');
  };

  useEffect(() => {
    let tmpStepConfig = {};
    let keys: string[] = Object.keys(props.toolsConfigState);
    for (let i = 0; i < keys.length; i++) {
      if (
        // @ts-ignore
        (Array.isArray(props.toolsConfigState[keys[i]]) && props.toolsConfigState[keys[i]].length > 0) ||
        // @ts-ignore
        (!Array.isArray(props.toolsConfigState[keys[i]]) && Object.keys(props.toolsConfigState[keys[i]]).length > 0)
      ) {
        // @ts-ignore
        tmpStepConfig = { ...tmpStepConfig, [keys[i]]: props.toolsConfigState[keys[i]] };
      }
    }
    let jsonToyamUtil = new jsonToyam();
    const yml = jsonToyamUtil.json2yaml(tmpStepConfig);
    setXmlValue(yml);
  }, [props.toolsConfigState]);

  const [aceHeight, setAceHeight] = useState<number>(0);
  const [aceWidth, setAceWidth] = useState<number>(0);

  useEffect(() => {
    let leftSiderDom = document.getElementById('lefeSiderId');
    let height = leftSiderDom?.getBoundingClientRect().height as number;
    let width = leftSiderDom?.getBoundingClientRect().width as number;
    setAceHeight(height - 78);
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
        textConfig: []
      };
      // @ts-ignore
      const yamlConfigs = window.YAML.parse(xmlValue);
      // 清空配置
      const configs = {
        ...initConfig,
        ...yamlConfigs
      };
      const keys = Object.keys(configs);
      for (let key of keys) {
        if (key === 'attribute' && !compare(configs[key], attribute)) {
          dispatch(updateAllAttributeConfigList(configs[key]));
        } else if (key === 'tagList' && !compare(configs[key], tagList)) {
          dispatch(updateTagConfigList(configs[key]));
        } else if (key === 'textConfig' && !compare(configs[key], textConfig)) {
          dispatch(updateTextConfig(configs[key]));
        } else if (key === 'tools' && !compare(configs[key], tools)) {
          dispatch(updateToolsConfig(configs[key]));
        } else if (key === 'fileInfo') {
          dispatch(updateFileInfo(configs[key]));
        }
      }
    } catch (error) {
      props.doSetImg(ConfigNotMatchImg);
      message.error('输入格式有误，请重新输入');
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
          tabSize: 2
        }}
      />
    </>
  );
};

export default YamlConfig;
