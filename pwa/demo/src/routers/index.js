import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import React from 'react';
import { useProvider } from '../contexts/routerContext';

import LayoutNormal from '../components/pages/Home/Layout/Normal';
import Home from '../components/pages/Home';
import Login from '../components/pages/Auth/Login';
import Article from '../components/pages/Home/Article/List';

import store from '../global-state';
import storage from '../utils/storage';

// 路由=>组件.没登录跳到登录.登录了匹配root.匹配失败就重定向route.

function App(props) {
  // props: history, location, match, staticContext
  const [router, routerContext] = useProvider(props.history, props.location);
  return <routerContext.Provider value={router}>
    <Switch>
      <Route path={'/root/:name'} component={AppRoot}></Route>
      <Route path={'/auth/login'} component={Login}></Route>
      <Route component={NoMatch}></Route>
    </Switch>
  </routerContext.Provider>
}

function AppRoot(props) {
  // 默认是home
  const name = props.location.pathname.split('/').pop();
  if (store.app.selectedMenu !== name) {
    store.app.setMenu(name);
  }
  if (isLogin()) {
    return <LayoutNormal>
      {props.location.pathname === '/root/demo' ? <Article loader={store.articleLoader} /> : <Home>{props.location.pathname}</Home>}
    </LayoutNormal>
  } else {
    return <Redirect to={'/auth/login'}></Redirect>
  }

}

function NoMatch({ location }) {
  if (isLogin()) {
    return <Redirect to={'/root/home'}></Redirect>
  } else {
    return <Redirect to={'/auth/login'}></Redirect>
  }
  // return <div>NoMatch</div>;
}

function isLogin() {
  let token = storage.getValue('access-token');
  return !!token;
}

export default function Index() {
  return <BrowserRouter basename={"/"}>
    <Route path={"/"} component={App}></Route>
  </BrowserRouter>
};