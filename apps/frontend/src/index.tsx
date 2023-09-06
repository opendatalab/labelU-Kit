import ReactDOM from 'react-dom/client';
import React from 'react';
import { Provider } from 'react-redux';
import '@label-u/video-react/dist/style.css';
import '@label-u/components-react/dist/style.css';

import './polyfills';
import App from './App';
import './initialize';
import { store } from './store';
import './styles/index.scss';

window.React = React;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>,
);
