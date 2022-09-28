import { BasicConfig } from '@label-u/components';
import React, { FC, useMemo } from 'react';
import RectConfigForm from './templates/rectConfigForm';
import LineConfigForm from './templates/lineConfigForm';
import PointConfigForm from './templates/pointConfigForm';
import TagConfigForm from './templates/tagConfigForm';
import TextConfigForm from './templates/textConfigForm';
import PolygonConfigForm from './templates/polygonConfigForm';
import './formEngine.less';
// import { toolnames, types,toolnameT } from './constants';
import { EToolName } from '@label-u/annotation';
import { useSelector } from 'react-redux';
// import Dynamic from 'components/basic/dynamic';
interface FormEngineProps {
  toolname: string;
  config: BasicConfig;
}

const FormEngine: FC<FormEngineProps> = props => {
  const { tagList, textConfig } = useSelector(state => state.toolsConfig);
  const ConfigTool = useMemo(() => {
    if (props.toolname) {
      if (props.toolname === EToolName.Rect) {
        // const result = await new Promise(async (resolve, reject) => {
        //   const { default: graph } = await import('./templates/rectConfigForm');
        //   resolve(graph);
        // });
        // return result;
        // return Dynamic(() => import('./templates/rectConfigForm'));

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
  return (
    <div>
      {ConfigTool && <ConfigTool tagList={tagList} textConfig={textConfig} name={props.toolname} {...props.config} />}
    </div>
  );
};
export default FormEngine;
