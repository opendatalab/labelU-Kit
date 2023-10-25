import ReactDOM from 'react-dom/client';
import React from 'react';
import '@labelu/video-react/dist/style.css';
import '@labelu/components-react/dist/style.css';

import './polyfills';
import App from './App';
import './initialize';
import './styles/index.css';

window.React = React;

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
