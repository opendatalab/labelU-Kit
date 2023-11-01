import styled, { css } from 'styled-components';

const Wrapper = styled.kbd<{ dark?: boolean }>`
  ${({ dark }) => css`
    background-color: ${dark ? '#27272a' : '#fff'};
    color: ${dark ? 'rgb(212, 212, 216)' : 'rgb(82, 82, 91)'};
    border: 1px solid ${dark ? '#27272a' : '#d9d9d9'};
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
