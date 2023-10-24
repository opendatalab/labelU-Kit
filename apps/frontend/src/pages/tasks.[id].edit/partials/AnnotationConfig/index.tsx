import { useContext } from 'react';
import styled from 'styled-components';

import { MediaType } from '@/api/types';
import FlexLayout from '@/layouts/FlexLayout';

import FormConfig from './formConfig';
import { TaskCreationContext } from '../../taskCreation.context';
import TemplateModal from './templateModal';

const Inner = styled(FlexLayout)`
  width: 740px;
  margin: 0 auto;
`;

// 配置页的config统一使用此组件的state
const AnnotationConfig = () => {
  const { task, onTemplateSelect } = useContext(TaskCreationContext);

  return (
    <FlexLayout full padding="1rem" flex="column">
      <Inner flex="column" full>
        <FlexLayout.Header flex justify="space-between">
          <h2>标注配置</h2>
          {task && task?.media_type === MediaType.IMAGE && <TemplateModal onSelect={onTemplateSelect} />}
        </FlexLayout.Header>
        <FlexLayout.Content>
          <FormConfig />
        </FlexLayout.Content>
      </Inner>
    </FlexLayout>
  );
};

export default AnnotationConfig;
