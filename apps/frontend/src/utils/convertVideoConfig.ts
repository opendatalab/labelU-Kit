import type { EditorProps } from '@label-u/video-editor-react';

import type { ToolsConfigState } from '@/types/toolConfig';

export function convertVideoConfig(taskConfig: ToolsConfigState) {
  const editorConfig: NonNullable<EditorProps['config']> = {} as NonNullable<EditorProps['config']>;

  taskConfig?.tools?.forEach((item) => {
    if (item.tool === 'videoSegmentTool') {
      editorConfig.segment = {
        ...editorConfig.segment,
        ...item.config,
        type: 'segment',
      };

      if (taskConfig.attributes) {
        if (!editorConfig.segment.attributes) {
          editorConfig.segment.attributes = [];
        }

        editorConfig.segment.attributes = taskConfig.attributes.concat(editorConfig.segment.attributes);
      }
    }

    if (item.tool === 'videoFrameTool') {
      editorConfig.frame = {
        ...editorConfig.frame,
        ...item.config,
        type: 'frame',
      };

      if (taskConfig.attributes) {
        if (!editorConfig.frame.attributes) {
          editorConfig.frame.attributes = [];
        }

        editorConfig.frame.attributes = taskConfig.attributes.concat(editorConfig.frame.attributes);
      }
    }

    if (item.tool === 'tagTool') {
      editorConfig.tag = item.config.attributes;
    }

    if (item.tool === 'textTool') {
      editorConfig.text = item.config.attributes;
    }
  });

  return editorConfig;
}
