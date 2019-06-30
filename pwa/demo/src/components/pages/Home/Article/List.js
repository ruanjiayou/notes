import React from 'react';
import { Observer } from 'mobx-react-lite';
import LoadListView from '../../../common/ListLoad/index';
import { useContext } from '../../../../contexts/routerContext/index';

import './List.css';

function RenderItem({ item, sectionId, router, remove }) {
  return <div key={index} className={'dd-article-item'}>
    <span>{item.title}</span> <span onClick={() => remove()}>x</span>
  </div>
}

export default function ({ loader }) {
  const router = useContext();
  return <Observer>
    {() => {
      return <LoadListView
        loader={loader}
        renderItem={(item, sectionId, index) => <RenderItem
          item={item}
          sectionId={sectionId}
          router={router}
          remove={() => loader.remove(index)}
        />}
      />
    }}
  </Observer>
}