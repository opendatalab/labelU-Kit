import { FC } from 'react';
// import { RouteProps } from 'react-router';
import PrivateRoute from './pravateRoute';
import { useIntl } from 'react-intl';
import { ReactElement } from 'react';

export interface WrapperRouteProps {
  /** document title locale id */
  titleId: string;
  /** authorization？ */
  auth?: boolean;

  element: ReactElement;
}

const WrapperRouteComponent: FC<WrapperRouteProps> = ({ titleId, auth, ...props }) => {
  const { formatMessage } = useIntl();
  if (titleId) {
    document.title = formatMessage({
      id: titleId
    });
  }
  return auth ? <PrivateRoute {...props} /> : (props.element as ReactElement);
};

export default WrapperRouteComponent;
