import App from './app';
import React from 'react';
import ReactDOM from 'react-dom';
import 'antd-mobile/dist/antd-mobile.css';
// import * as ServiceWorker from './service-worker';

import './mock';

// 总入口: 将组件挂载到dom上
ReactDOM.render(<App />, document.getElementById('root'));