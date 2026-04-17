import { types } from 'mobx-state-tree';

const Model = types.model({
  title: types.string,
  content: types.string,
});

export default Model;