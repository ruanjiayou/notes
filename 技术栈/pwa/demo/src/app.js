// eslint-disable-next-line
import React, { useCallback, useState, Fragment } from 'react';
import { Observer } from 'mobx-react-lite';
import RouterRoot from './routers';

// 引入router.顺便做点什么: loading/emptyView什么的
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