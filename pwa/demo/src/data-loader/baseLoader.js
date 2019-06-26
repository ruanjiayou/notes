import { flow, types } from 'mobx-state-tree';
import EventEmitter from 'eventemitter3';

// refresh/more
function setupEvent() {
  const events = new EventEmitter();
  return {
    on(...args) {
      events.on(...args);
    },
    off(...args) {
      events.off(...args);
    },
    emit(...args) {
      events.emit(...args);
    },
  }
}

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
      get isRefreshing() {
        return self.isLoading && self.loadingType === 'refresh';
      }
    }
  }).actions(self => {
    const request = flow(function* (params = {}, type = 'refresh') {
      if (self.isLoading || (self.isEnded && self.type === 'more')) {
        return;
      }
      console.log(self.items, type);
      self.type = type;
      self.error = undefined;
      self.isLoading = true;
      self.state = 'success';
      try {
        let { ended, items } = yield fn(params, type);
        console.log(items)
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
        }
        self.emit(self.type, self.error, items || [], self.items);
      } catch (err) {
        // 加载失败
        self.state = 'fail';
        if (err.code) {
          self.error = { code: err.code, message: err.message };
        } else {
          self.error = { code: 'unkown', message: '未知错误' };
        }
        self.emit(self.type, self.error);
      } finally {
        self.isLoading = false;
      }
    });
    return {
      clear() {
        self.page = 1;
        self.items = [];
      },
      async refresh(params) {
        await request(params, 'refresh');
      },
      async loadMore(params) {
        self.page++;
        await request(params, 'more');
      }
    }
  }).actions(setupEvent);

  return types.optional(unionModel, {});
}

export {
  createItemsLoader
}