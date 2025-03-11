import { types } from 'mobx-state-tree';

const Model = types.model({
  selectedMenu: types.optional(types.string, 'home'),
  fullScreen: types.optional(types.boolean, false),
  accessTokenName: 'access-token',
}).actions(self => {
  return {
    setMenu(name) {
      self.selectedMenu = name;
    }
  }
});

export default Model;