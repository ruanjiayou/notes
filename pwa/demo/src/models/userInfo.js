import { types } from 'mobx-state-tree';

const Model = types.model({
  username: types.optional(types.string, ''),
  accessToken: types.optional(types.string, ''),
});

export default Model;