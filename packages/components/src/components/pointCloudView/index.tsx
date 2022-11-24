import { getClassName } from '@/utils/dom';
import React, { useMemo } from 'react';
import PointCloud3DView from './PointCloud3DView';
import PointCloudBackView from './PointCloudBackView';
import PointCloudTopView from './PointCloudTopView';
import PointCloudSideView from './PointCloudSideView';
// import PointCloud2DView from './PointCloud2DView';
import PointCloudListener from './PointCloudListener';
import { AppState } from '@/store';
import { connect } from 'react-redux';
import { LabelUContext } from '@/store/ctx';
import { IProps } from '@/views/MainView/annotationOperation';

const PointCloudView: React.FC<IProps> = (props) => {
  if (props.imgList.length === 0) {
    return null;
  }
  const pcConfig = useMemo(() => {
    let comBineConfig = { ...props.toolsBasicConfig[0] };
    //@ts-ignore
    let tmpAttribute = [...comBineConfig['config']['attributeList'], ...props.attributeList];
    return {
      tool: 'pointTool',
      config: {
        ...comBineConfig.config,
        attributeList: tmpAttribute,
      },
    };
  }, [props.toolsBasicConfig, props.attributeList]);

  return (
    <>
      <PointCloudListener />
      <div className={getClassName('point-cloud-layout')} onContextMenu={(e) => e.preventDefault()}>
        <div className={getClassName('point-cloud-wrapper')}>
          <div className={getClassName('point-cloud-container', 'left')}>
            <PointCloud3DView config={pcConfig}/>
          </div>

          <div className={getClassName('point-cloud-container', 'right')}>
            <PointCloudTopView config={pcConfig} />
            <PointCloudSideView />
            <PointCloudBackView />
            {/* <div className={getClassName('point-cloud-container', 'right-bottom')}>

            </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state: AppState) => ({
  imgList: state.annotation.imgList,
});

export default connect(mapStateToProps, null, null, { context: LabelUContext })(PointCloudView);
