import App from './app';
import React from 'react';
import ReactDOM from 'react-dom';
import 'antd-mobile/dist/antd-mobile.css';
import './components/common.css';
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/src/serviceWorker.js
import * as serviceWorker from './service-work';

// import './mock';

// 总入口: 将组件挂载到dom上
ReactDOM.render(<App />, document.getElementById('root'));

// serviceWorker.unregister();
serviceWorker.register();