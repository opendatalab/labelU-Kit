import styled from 'styled-components';

const StyledContainer = styled.div`
  padding: 0 2rem;
`;

export interface BlockContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function BlockContainer({ children, className, style }: BlockContainerProps) {
  return (
    <StyledContainer style={style} className={className}>
      {children}
    </StyledContainer>
  );
}
