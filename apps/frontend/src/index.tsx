import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './polyfills';
import App from './App';
import reportWebVitals from './reportWebVitals';
import store from './stores';
import './styles/index.less';
// import './mock';
import 'antd/dist/antd.css';
// import 'virtual:svg-icons-register';

ReactDOM.render(
  <Provider store={store}>
    <div className="App">
      <App />
    </div>
  </Provider>,
  document.getElementById('root'),
);
// hmr enable
// if (module.hot && process.env.NODE_ENV === 'development') {
//   module.hot.accept();
// }

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
