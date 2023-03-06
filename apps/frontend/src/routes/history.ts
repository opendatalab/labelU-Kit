import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

history.listen((...args) => {
  console.debug('history.listen', ...args);
});

export default history;
