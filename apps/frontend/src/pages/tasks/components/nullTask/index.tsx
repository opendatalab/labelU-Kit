import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FlexLayout } from '@labelu/components-react';

import demoCreate from './assets/demo-create-button.svg';
import taskCreate from './assets/task-create-button.svg';

const Wrapper = styled(FlexLayout.Item)`
  position: relative;
  display: flex;
  width: 360px;
  height: 160px;
  box-sizing: border-box;
  justify-content: space-between;
  padding: 2rem 1rem 2rem 2rem;
  align-items: center;
  font-size: 13px;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    margin: 0px;
    border-radius: 1rem;
    background: linear-gradient(to right, #6799ff, #5a0ed446);
  }

  &:after {
    transition: all 0.2s ease-in-out;
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    background: #fff;
    background-clip: padding-box;
    border: solid 1px transparent;
    border-radius: 1rem;
  }

  &:hover {
    &:after {
      box-shadow: 0px 8px 26px rgba(0, 0, 0, 0.12);
    }
  }

  cursor: pointer;
`;

const Title = styled.span`
  font-size: 1.125rem;
  font-weight: 600;
`;

const Description = styled.span`
  color: rgba(18, 19, 22, 0.8);
`;

const NullTask = () => {
  const navigate = useNavigate();
  const createTask = () => {
    navigate('/tasks/0/edit?isNew=true');
  };

  const goDemo = () => {
    window.open('https://opendatalab.github.io/labelU-Kit/#/image', '_blank');
  };

  return (
    <FlexLayout flex="row" full gap="1.5rem" items="center" justify="center">
      <Wrapper data-wiz="demo-start" onClick={goDemo} gap="1.5rem">
        <FlexLayout.Item flex="column" full justify="space-between" style={{ zIndex: 3 }}>
          <Title>Demo体验</Title>
          <Description>提供图片、音频、视频标注工具</Description>
          <a data-wiz="demo-start">点击体验 &nbsp;&gt;&gt;</a>
        </FlexLayout.Item>
        <div style={{ zIndex: 3 }}>
          <img src={demoCreate} width={90} alt="demo-create" />
        </div>
      </Wrapper>
      <Wrapper data-wiz="task-create" onClick={createTask} gap="1.5rem">
        <FlexLayout.Item flex="column" full justify="space-between" style={{ zIndex: 3 }}>
          <Title>新建任务</Title>
          <Description>提供多种标注工具，点击“新建任务”即可开始标注</Description>
          <Link data-wiz="task-create" to="/tasks?id=demo">
            点击新建 &nbsp;&gt;&gt;
          </Link>
        </FlexLayout.Item>
        <div style={{ zIndex: 3 }}>
          <img src={taskCreate} width={90} alt="task-create" />
        </div>
      </Wrapper>
    </FlexLayout>
  );
};
export default NullTask;
