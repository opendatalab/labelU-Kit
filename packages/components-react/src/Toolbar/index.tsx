import styled, { css } from 'styled-components';
import { useEffect, useState } from 'react';

import { Divider } from '../Divider';
import { ReactComponent as UndoIcon } from './undo.svg';
import { ReactComponent as RedoIcon } from './redo.svg';

const Wrapper = styled.div`
  height: 56px;
  font-size: 14px;
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Item = styled.div<{ disabled?: boolean; active?: boolean }>`
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    font-size: 1.5rem;
  }

  &:hover {
    ${({ disabled }) =>
      !disabled &&
      css`
        svg {
          color: var(--color-primary);
        }
      `}
  }

  ${({ disabled }) =>
    disabled &&
    css`
      cursor: not-allowed;
      color: #999;
    `}

  ${({ active }) =>
    active &&
    css`
      color: var(--color-primary);

      svg {
        color: var(--color-primary);
      }
    `}
`;

const SwitchCircle = styled.div`
  width: 12px;
  height: 12px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  left: 2px;
  transition: transform 0.2s ease-in-out;
`;

const SwitchWrapper = styled.div<{ on?: boolean }>`
  width: 32px;
  height: 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  position: relative;
  transition: background-color 0.2s ease-in-out;

  ${({ on }) => css`
    background-color: ${on ? 'var(--color-primary)' : '#ccc'};

    ${SwitchCircle} {
      transform: translateX(${on ? '16px' : '0'});
    }
  `}
`;

function SimpleSwitch({ value }: { value?: boolean }) {
  const [isToggled, setToggle] = useState(value);

  const handleToggle = () => {
    setToggle(!isToggled);
  };

  useEffect(() => {
    setToggle(value);
  }, [value]);

  return (
    <SwitchWrapper on={isToggled} onClick={handleToggle}>
      <SwitchCircle />
    </SwitchWrapper>
  );
}

export interface ToolbarProps {
  tools?: React.ReactNode;
  extra?: React.ReactNode;
  right?: React.ReactNode;
  disableUndo?: boolean;
  disableRedo?: boolean;
  onRedo?: () => void;
  onUndo?: () => void;
  onOrderSwitch?: (value: boolean) => void;
  showOrder?: boolean;
}

Toolbar.Item = Item;

export function Toolbar({
  tools,
  extra,
  right,
  disableUndo,
  disableRedo,
  onOrderSwitch,
  showOrder,
  onUndo,
  onRedo,
}: ToolbarProps) {
  const [orderVisible, setOrderVisible] = useState<boolean | undefined>(showOrder);

  useEffect(() => {
    setOrderVisible(showOrder);
  }, [showOrder]);

  const handleOrderSwitch = () => {
    setOrderVisible((visible) => {
      onOrderSwitch?.(!visible);
      return !visible;
    });
  };

  return (
    <Wrapper>
      <Left>
        {tools && tools}
        {tools && <Divider direction="vertical" style={{ height: '1.5em' }} />}
        <Item disabled={disableUndo} onClick={disableUndo ? undefined : onUndo}>
          <UndoIcon />
        </Item>
        <Item disabled={disableRedo} onClick={disableRedo ? undefined : onRedo}>
          <RedoIcon />
        </Item>
        <Divider direction="vertical" style={{ height: '1.5em' }} />
        <Item onClick={handleOrderSwitch}>
          显示顺序 &nbsp;
          <SimpleSwitch value={orderVisible} />
        </Item>
        {extra && extra}
      </Left>
      {right && right}
    </Wrapper>
  );
}
