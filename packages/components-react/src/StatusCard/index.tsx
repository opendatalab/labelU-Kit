import styled, { css } from 'styled-components';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckSvgIcon } from './check.svg';

const CheckIconWithBg = styled(CheckSvgIcon)`
  position: absolute;
  top: 0.15rem;
  right: 0.15rem;
  font-size: 12px;
  z-index: 3;
  color: #fff;
`;

const Triangle = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  width: 0px;
  height: 0px;
  border-style: solid;
  border-width: 0 28px 28px 0;
  border-color: transparent var(--color-primary) transparent transparent;
  transform: rotate(0deg);
`;

export const SkipWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  background: #f80;
  border-radius: 0 4px;
  width: 36px;
  height: 25px;
  color: white;
  text-align: center;
  font-weight: 400;
  font-size: 12px;
  line-height: 25px;
`;

function CheckIcon() {
  return (
    <>
      <Triangle />
      <CheckIconWithBg />
    </>
  );
}

const Inner = styled.div`
  border-radius: 3px;
`;

const Title = styled.div`
  font-size: 14px;
`;

const StatusCardDiv = styled.div<{
  active?: boolean;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;

  ${({ active }) =>
    active &&
    css`
      ${Inner} {
        border: 3px solid var(--color-primary);
      }

      ${Title} {
        background-color: var(--color-primary);
        color: #fff;
        border-radius: 3px;
        padding: 2px 4px;
      }
    `}
`;

export interface StatusCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;

  completed?: boolean;

  skipped?: boolean;

  active?: boolean;

  children?: React.ReactNode;
}

export function StatusCard({ title, active, completed, skipped, children, onClick }: StatusCardProps) {
  // @ts-ignore
  const { t } = useTranslation();

  return (
    <StatusCardDiv active={active} onClick={onClick}>
      <Inner>{children}</Inner>
      {title && <Title>{title}</Title>}
      {completed && <CheckIcon />}
      {skipped && <SkipWrapper>{t('skipped')}</SkipWrapper>}
    </StatusCardDiv>
  );
}
