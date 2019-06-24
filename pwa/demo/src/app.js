import React, { useCallback, useState, Fragment } from 'react';
import { Observer } from 'mobx-react-lite';
import 'antd-mobile/dist/antd-mobile.css';
import RouterRoot from './routers';

function App() {
  return <Fragment>
    <Observer>
      {() => {
        return <RouterRoot></RouterRoot>
      }}
    </Observer>
  </Fragment>
}

export default App;