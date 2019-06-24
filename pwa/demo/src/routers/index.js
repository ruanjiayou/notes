import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import React from 'react';
import { useProvider } from '../contexts/routerContext';

import Home from '../components/Home';
import Login from '../components/Auth/Login';

import storage from '../utils/storage';

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
  if (isLogin()) {
    return <Home />
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