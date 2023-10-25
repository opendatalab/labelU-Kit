import styled, { css } from 'styled-components';

import FlexLayout from '@/layouts/FlexLayout';

export const Wrapper = styled(FlexLayout)`
  margin-bottom: 10px;
  cursor: pointer;
`;

export const IdWrapper = styled.div`
  border-radius: 2px;
  padding: 0 0.25rem;
`;

export const SkipWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1000;
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

export const ContentWrapper = styled<any>(FlexLayout.Content)`
  position: relative;
  margin-bottom: 10px;
  background: #fff;
  overflow: hidden;

  & > img {
    width: 200px;
    height: 120px;
    object-fit: cover;
  }

  ${({ active }) =>
    active &&
    css`
      outline: 3px solid var(--color-primary);

      & + ${IdWrapper} {
        background: var(--color-primary);
        color: #fff;
      }
    `}
`;

export const CheckWrapper = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  z-index: 1000;
  width: 16px;
  height: 16px;
`;

export const CheckBg = styled.div`
  position: absolute;
  top: -16px;
  right: -16px;
  z-index: 100;
  width: 32px;
  height: 32px;
  transform: rotate(-45deg);
  background-color: var(--color-primary);
`;

export const AudioWrapper = styled(FlexLayout)`
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
  cursor: pointer;
  border-radius: 3px;
`;
