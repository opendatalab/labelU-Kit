import { useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';

interface ResponseProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  style?: React.CSSProperties;
  children?: React.ReactNode;
  className?: string;
}

export function useResponse() {
  const isXXSmallScreen = useMediaQuery({
    maxWidth: 600,
  });
  const isXSmallScreen = useMediaQuery({
    minWidth: 601,
    maxWidth: 800,
  });
  const isSmallScreen = useMediaQuery({
    minWidth: 801,
    maxWidth: 1200,
  });
  const isRegularScreen = useMediaQuery({
    minWidth: 1201,
    maxWidth: 1600,
  });
  const isLargeScreen = useMediaQuery({
    minWidth: 1601,
    maxWidth: 2500,
  });
  const isXLargeScreen = useMediaQuery({
    minWidth: 2501,
  });

  return {
    /** basis = '100%';  */
    isXXSmallScreen,
    /** basis = '50%';  */
    isXSmallScreen,
    /** basis = '33.3%';  */
    isSmallScreen,
    /** basis = '25%';  */
    isRegularScreen,
    /** basis = '20%';  */
    isLargeScreen,
    /** basis = '16.6%';  */
    isXLargeScreen,
  };
}

// Flex 响应式布局
export default function FlexItem({ style, children, className, ...props }: ResponseProps) {
  const { isXXSmallScreen, isXSmallScreen, isSmallScreen, isRegularScreen, isLargeScreen, isXLargeScreen } =
    useResponse();

  let basis = '25%';
  if (isXXSmallScreen) {
    basis = '100%';
  } else if (isXSmallScreen) {
    basis = '50%';
  } else if (isSmallScreen) {
    basis = '33.3%';
  } else if (isRegularScreen) {
    basis = '25%';
  } else if (isLargeScreen) {
    basis = '20%';
  } else if (isXLargeScreen) {
    basis = '16.6%';
  }

  const wrapperStyle = useMemo(() => {
    return {
      ...style,
      flexBasis: basis,
    } as React.CSSProperties;
  }, [basis, style]);

  return (
    <div className={className} style={wrapperStyle} {...props}>
      {children}
    </div>
  );
}
