import { types } from 'mobx-state-tree';

const routerUnit = types.model({
  routeType: types.maybe(types.string),
  viewName: types.maybe(types.string),
  params: types.frozen({})
}).views(self => {
  return {
    get isActive() {
      return self.routeType && self.viewName;
    }
  }
});

const Model = types.model('RouterContext', {
  pathname: types.maybe(types.string),
  search: types.maybe(types.string),
  params: types.frozen({}),
  root: types.optional(routerUnit, {}),
  window: types.optional(routerUnit, {}),
  screen: types.optional(routerUnit, {}),
}).actions(self => {
  return {
    setUp(pathname, search) {
      // TODO: 初始化
    }
  }
});

export default Model;