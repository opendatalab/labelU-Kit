import intl from 'react-intl-universal';
import styled from 'styled-components';

import FlexLayout from '@/layouts/FlexLayout';
import { ReactComponent as Logo } from '@/assets/svg/LOGO.svg';

const Description = styled.span`
  text-align: center;
  color: var(--color-text-secondary);
`;

const LogoTitle = () => {
  return (
    <FlexLayout flex="column" items="center" gap="1rem">
      <Logo />
      <Description>
        <div>{intl.get('loginTitle1')}</div>
        <div>{intl.get('loginTitle2')}</div>
      </Description>
    </FlexLayout>
  );
};
export default LogoTitle;
