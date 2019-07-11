import { flow, types } from 'mobx-state-tree';

function createItemsLoader(model, fn, defaultValue) {
  const unionModel = types.model({
    // 数据数组
    items: types.array(model),
    // 当前页码
    page: types.optional(types.number, 0),
    // 是否完毕
    isEnded: types.optional(types.boolean, false),
    // 是否加载中
    isLoading: types.optional(types.boolean, false),
    // 请求状态
    state: types.optional(types.enumeration(['success', 'fail']), 'success'),
    // 操作类型
    type: types.optional(types.enumeration(['refresh', 'more']), 'refresh'),
    // 错误信息
    error: types.maybe(types.model({
      code: types.maybe(types.string),
      message: types.maybe(types.string)
    })),
  }).views(self => {
    return {
      get isEmpty() {
        return !(self.items && self.items.length > 0);
      },
      get length() {
        return self.items.length;
      },
    }
  }).actions(self => {
    const request = flow(function* (params = {}, type = 'refresh') {
      if (self.isLoading || (self.isEnded && type === 'more')) {
        return;
      }
      self.type = type;
      self.error = undefined;
      self.isLoading = true;
      self.state = 'success';
      try {
        let { ended, items } = yield fn(params, type);
        // 第一页也可能是最后一页
        self.isEnded = !!ended;
        if (type === 'refresh') {
          // 刷新
          self.page = 1;
          self.items = items;
        } else if (items.length > 0) {
          // 加载更多
          self.page = params.page;
          self.items.push(...items);
        } else {
          self.state = 'fail';
          self.error = { code: 1, message: 'x' }
        }
      } catch (err) {
        // 加载失败
        self.state = 'fail';
        if (err.code) {
          self.error = { code: err.code, message: err.message };
        } else {
          self.error = { code: 'unkown', message: '未知错误' };
        }
      } finally {
        self.isLoading = false;
      }
    });
    return {
      clear() {
        self.page = 1;
        self.items = [];
      },
      remove(index) {
        self.items = self.items.slice().filter((item, idx) => +index !== +idx)
      },
      append(item) {
        self.items.push(item);
      },
      async refresh(params) {
        await request(params, 'refresh');
      },
      async loadMore(params) {
        self.page++;
        await request(params, 'more');
      }
    }
  });

  return types.optional(unionModel, {});
}

export {
  createItemsLoader
}