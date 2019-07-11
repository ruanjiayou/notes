import { types } from 'mobx-state-tree';
import store from '../global-state';
import storage from '../utils/storage';

const Model = types.model({
  account: types.optional(types.string, ''),
  accessToken: types.optional(types.string, ''),
}).actions(self => {
  return {
    logout() {
      self.accessToken = '';
      storage.removeKey(store.app.accessTokenName);
    }
  }
});

export default Model;