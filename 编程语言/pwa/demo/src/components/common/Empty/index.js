import React from 'react';

const style = { textAlign: 'center' };

export default function renderEmpty(loader, options) {
  if (loader.isEmpty) {
    if (loader.isLoading) {
      return <div style={style}>加载中...</div>
    } else if (loader.error) {
      return <div style={style}>出错啦!{loader.error.message}<span onClick={() => loader.refresh()}>点我重试</span></div>
    } else {
      return <div style={style}>没有数据,<span onClick={() => loader.refresh()}>点我重试</span></div>
    }
  }
}