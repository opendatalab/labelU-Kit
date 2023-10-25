import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from 'antd';

import { ReactComponent as CreateTaskIcon } from '@/assets/svg/create-task.svg';
import FlexLayout from '@/layouts/FlexLayout';

const Wrapper = styled(FlexLayout.Item)`
  display: flex;
  flex-direction: column;
  width: 288px;
  height: 220px;
  background: #fbfcff;
  border: 1px dashed #d0dfff;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

const NullTask = () => {
  const navigate = useNavigate();
  const createTask = () => {
    navigate('/tasks/0/edit?isNew=true');
  };

  return (
    <FlexLayout flex="column" full items="center" justify="center">
      <Wrapper onClick={createTask} gap="1rem">
        <CreateTaskIcon />
        <Button type="primary">新建任务</Button>
      </Wrapper>
    </FlexLayout>
  );
};
export default NullTask;
