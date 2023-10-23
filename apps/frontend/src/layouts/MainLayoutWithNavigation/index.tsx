import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import Navigate from '@/components/Navigate';

import FlexLayout from '../FlexLayout';

const LayoutWrapper = styled(FlexLayout)`
  min-height: 100vh;
`;

const MainContent = styled(FlexLayout.Content)`
  background-color: #f4f5f7;
`;

const MainLayout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 标注配置预览不需要导航头部
  const isPreview = searchParams.get('noSave');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const _username = localStorage.getItem('username');

    if (!token || !_username) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <LayoutWrapper direction="column">
      {!isPreview && (
        <FlexLayout.Header>
          <Navigate />
        </FlexLayout.Header>
      )}
      <MainContent>
        <Outlet />
      </MainContent>
    </LayoutWrapper>
  );
};
export default MainLayout;
