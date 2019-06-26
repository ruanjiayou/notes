import { types } from 'mobx-state-tree';

const Model = types.model({
  selectedMenu: types.optional(types.string, 'home'),
  fullScreen: types.optional(types.boolean, false),
}).actions(self => {
  return {
    setMenu(name) {
      self.selectedMenu = name;
    }
  }
});

export default Model;