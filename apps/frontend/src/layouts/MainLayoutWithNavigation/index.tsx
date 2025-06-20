import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { FlexLayout } from '@labelu/components-react';

import Navigate from '@/components/Navigate';

const LayoutWrapper = styled(FlexLayout)`
  min-height: 100vh;
`;

const MainContent = styled(FlexLayout.Content)`
  background: linear-gradient(178deg, #f0f6fb 0%, #f4f4fc 100%);
`;

const MainLayout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 标注配置预览不需要导航头部
  const isPreview = searchParams.get('noSave');

  useEffect(() => {
    if (window.IS_ONLINE) {
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <LayoutWrapper flex="column">
      {!isPreview && (
        <FlexLayout.Header>
          <Navigate />
        </FlexLayout.Header>
      )}
      <MainContent flex="column">
        <Outlet />
      </MainContent>
    </LayoutWrapper>
  );
};
export default MainLayout;
