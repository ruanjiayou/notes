import React, { useContext as useReactContext, useState } from 'react';
import RouterModel from '../../models/router';
/**
 * back()
 * push()
 * replace()
 */
const Context = React.createContext(null);
const routerState = RouterModel.create({});

/**
 * 使用:
 * 创建上下文
 * import createProvider from this
 * const [router, routerContext]=createProvider(history,location);
 * <routerContext.Provider value={router}>
 *   ...
 * </routerContext.Provider>
 * 使用上下文
 * import useContext from this
 * let router = useContext();
 * router.goto(...);
 */
export function useProvider(history, location) {
  let [state] = useState(() => {
    let route = {
      history,
      routerState,
      get params() {
        return {}
      },
      back() {
        const { userClick, login } = history.location.state || {};
        if (login) {
          // 登录跳转进来的页面
          route.backToRoot();
        } else if (userClick) {
          // 正常操作进入
          route.goBack();
        } else {
          // 可能是直接通过URL进来的
          route.backToRoot();
        }
      },
      backToRoot(params, state) {
        const { pathname, search } = getBackToRootLocation(params);
        history.push({
          pathname,
          search,
          state: {
            login: true,
            userClick: true,
            ...state
          }
        });
      },
      gotoLoginTarget() {
        // target 存于全局store中
        // 因为某种原因被强制跳到login,登录后返回原来的位置
        // getStore => 如果有则跳转,否则到首页
        // TODO:
      },
      pushView({ viewName, params, state }) {
        state = state || {};
        state.userClick = true;
        let { pathname, search } = getLocation();
        history.push({
          pathname,
          search,
          state
        });
      },
      replaceView({ viewName, params, state }) {
        state = state || {};
        state.userClick = true;
        let { pathname, search } = getLocation();
        history.replace({
          pathname,
          search,
          state
        });
      }
    };
    return route;
  });
  return [state, Context];
}

export function useContext() {
  return useReactContext(Context);
}

function getLocation() {

}

function getBackToRootLocation() {

}
