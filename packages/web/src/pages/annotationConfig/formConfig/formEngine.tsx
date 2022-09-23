import { BasicConfig } from '@label-u/components';
import React, { FC, useMemo } from 'react';
import RectConfigForm from './templates/rectConfigForm';
import LineConfigForm from './templates/lineConfigForm';
import PointConfigForm from './templates/pointConfigForm';
import TagConfigForm from './templates/tagConfigForm';
import TextConfigForm from './templates/textConfigForm';
import PolygonConfigForm from './templates/polygonConfigForm';
import './formEngine.less';

interface FormEngineProps {
  toolname: string;
  config: BasicConfig;
}

const FormEngine: FC<FormEngineProps> = props => {
  const ConfigTool = useMemo(() => {
    if (props.toolname) {
      if (props.toolname === '拉框') {
        // const result = await new Promise(async (resolve, reject) => {
        //   const { default: graph } = await import('./templates/rectConfigForm');
        //   resolve(graph);
        // });
        // debugger;
        // return result;
        return RectConfigForm;
      }
      if (props.toolname === '标点') {
        return PointConfigForm;
      }
      if (props.toolname === '线条') {
        return LineConfigForm;
      }
      if (props.toolname === '多边形') {
        return PolygonConfigForm;
      }
      if (props.toolname === '标签') {
        return TagConfigForm;
      }
      if (props.toolname === '文本') {
        return TextConfigForm;
      }
    }
    return null;
  }, [props.toolname]);

  return <div>{ConfigTool && <ConfigTool {...props.config} />}</div>;
};
export default FormEngine;
