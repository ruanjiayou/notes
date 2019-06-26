import React, { Fragment } from 'react';
import { useMount } from 'react-use';
import { Observer } from 'mobx-react-lite';
import { ListView, PullToRefresh } from 'antd-mobile';
import renderEmptyView from '../Empty/index';

const dataProvider = new ListView.DataSource({
  rowHasChanged: (row1, row2) => false
});

function MyBody(props) {
  return <div className="am-list-body">{props.children}</div>
}

function renderList({ loader, renderItem, }) {
  const dataSource = dataProvider.cloneWithRows(loader.items);
  const EmptyView = renderEmptyView(loader);
  return <Fragment>
    <div style={{ display: loader.isEmpty ? 'block' : 'none' }}>{EmptyView}</div>
    <ListView
      style={{ height: '100%', overflow: 'auto', display: loader.isEmpty ? 'none' : 'block' }}
      dataSource={dataSource}
      renderRow={(rowData, sectionId, rowId) => renderItem(rowData, sectionId, rowId)}
      renderBodyComponent={() => <MyBody />}
      initialListSize={10}
      onEndReachedThreshold={10}
      onEndReached={loader.loadMore}
      pullToRefresh={<PullToRefresh refreshing={false} onRefresh={loader.refresh} />}
      /**
       * useBodyScroll
       * onScroll
       */
      renderFooter={() => <div style={{ textAlign: 'center', padding: 5 }}>{loader.isLoading ? '正在加载更多数据...' : '已全部加载完毕'}</div>}
    />
  </Fragment>
}

export default function (props) {
  const { loader } = props;
  useMount(() => {
    if (loader.isEmpty) {
      loader.refresh();
    }
  });
  return <div style={{ display: 'flex', flex: '1 1', height: '100%', flexDirection: 'column' }}>
    <Observer>
      {() => {
        return renderList(props);
      }}
    </Observer>
  </div>
}
