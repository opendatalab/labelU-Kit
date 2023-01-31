import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import type { AppState } from '@/store';
import type { ToolInstance } from '@/store/annotation/types';
import useSafeState from '@/hooks/useSafeSate';

interface IProps {
  toolInstance: ToolInstance;
}

const ZoomLevel: React.FC<IProps> = ({ toolInstance }) => {
  const [, forceRender] = useSafeState<number>(0);
  useEffect(() => {
    if (toolInstance) {
      // 这里会有内存泄漏的问题  useSafeState 用这个解决下
      toolInstance.singleOn('renderZoom', () => {
        forceRender((s) => s + 1);
      });
    }
  }, [forceRender, toolInstance]);

  const zoom = toolInstance?.zoom ?? 1;

  return <span className="zoomValue">{(zoom * 100).toFixed(1)}%</span>;
};

const mapStateToProps = (state: AppState) => ({
  toolInstance: state.annotation.toolInstance,
});

export default connect(mapStateToProps)(ZoomLevel);
