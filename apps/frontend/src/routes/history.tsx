import React from 'react';
import { createBrowserHistory } from 'history';
import { Router } from 'react-router-dom';

export const history = createBrowserHistory();

interface HistoryRouterProps {
  history: typeof history;
}

// @ts-ignore
export const HistoryRouter: React.FC<HistoryRouterProps> = ({ history: _history, children }) => {
  const [state, setState] = React.useState({
    action: _history.action,
    location: _history.location,
  });

  React.useLayoutEffect(() => {
    history.listen(setState);
  }, [_history]);

  return React.createElement(Router, Object.assign({ children, navigator: history }, state));
};
