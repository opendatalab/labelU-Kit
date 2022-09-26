import { BasicConfig } from '@label-u/components';
import React, { FC, useMemo } from 'react';
import RectConfigForm from './templates/rectConfigForm';
import LineConfigForm from './templates/lineConfigForm';
import PointConfigForm from './templates/pointConfigForm';
import TagConfigForm from './templates/tagConfigForm';
import TextConfigForm from './templates/textConfigForm';
import PolygonConfigForm from './templates/polygonConfigForm';
import CommonFormItem from '../components/commonFormItems';
import './formEngine.less';
// import { toolnames, types,toolnameT } from './constants';
import { EToolName } from '@label-u/annotation';
interface FormEngineProps {
  toolname: string;
  config: BasicConfig;
}

const FormEngine: FC<FormEngineProps> = props => {
  const FormItem = <CommonFormItem />;

  const ConfigTool = useMemo(() => {
    if (props.toolname) {
      if (props.toolname === EToolName.Rect) {
        // const result = await new Promise(async (resolve, reject) => {
        //   const { default: graph } = await import('./templates/rectConfigForm');
        //   resolve(graph);
        // });
        // debugger;
        // return result;
        return RectConfigForm;
      }
      if (props.toolname === EToolName.Point) {
        return PointConfigForm;
      }
      if (props.toolname === EToolName.Line) {
        return LineConfigForm;
      }
      if (props.toolname === EToolName.Polygon) {
        return PolygonConfigForm;
      }
      if (props.toolname === EToolName.Tag) {
        return TagConfigForm;
      }
      if (props.toolname === EToolName.Text) {
        return TextConfigForm;
      }
    }
    return null;
  }, [props.toolname]);

  return <div>{ConfigTool && <ConfigTool name={props.toolname} {...props.config} CommonFormItems={FormItem} />}</div>;
};
export default FormEngine;
