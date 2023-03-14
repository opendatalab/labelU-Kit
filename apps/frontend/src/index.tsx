import ReactDOM from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import 'antd/dist/antd.css';

import './polyfills';
import App from './App';
import './initialize';
import { store } from './store';
import './styles/index.scss';

window.React = React;

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'),
);
