import styled, { css } from 'styled-components';

const Wrapper = styled.kbd<{ dark?: boolean }>`
  ${({ dark }) => css`
    background-color: ${dark ? '#27272a' : '#fff'};
    color: ${dark ? 'rgb(212, 212, 216)' : 'rgb(82, 82, 91)'};
    box-shadow: ${dark
      ? `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 5px 0px,
    rgba(0, 0, 0, 0.2) 0px 2px 10px 0px, rgba(255, 255, 255, 0.15) 0px 0px 1px 0px inset`
      : `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.02) 0px 0px 1px 0px, rgba(0, 0, 0, 0.06) 0px 3px 0px 0px, rgba(0, 0, 0, 0.3) 0px 0px 1px 0px`};
  `}
  border-radius: 4px;
  display: inline-block;
  padding: 2px 6px;
  white-space: nowrap;
  font-family: ui-monospace;
  margin: 0 0.1em;
`;

export function Kbd({
  children,
  dark,
}: React.PropsWithChildren<{
  dark?: boolean;
}>) {
  return <Wrapper dark={dark}>{children}</Wrapper>;
}
