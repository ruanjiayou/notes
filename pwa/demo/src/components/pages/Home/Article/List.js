import React from 'react';
import { Observer } from 'mobx-react-lite';
import LoadListView from '../../../common/ListLoad/index';
import { useContext } from '../../../../contexts/routerContext/index';

import './List.css';
import store from '../../../../global-state';

function renderItem(item, index, router) {
  return <div key={index} className={'dd-article-item'}>
    <span>{item.title}</span>
  </div>
}

export default function ({ self }) {
  const router = useContext();
  return <Observer>
    {() => {
      return <LoadListView
        loader={store.articleLoader}
        renderItem={(data, index) => renderItem(data, index, router)}
      />
    }}
  </Observer>
}