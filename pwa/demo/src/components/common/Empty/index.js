import React from 'react';

const style = { textAlign: 'center' };

export default function renderEmpty(loader, options) {
  if (loader.isEmpty) {
    if (loader.isLoading) {
      return <div style={style}>加载中...</div>
    } else if (loader.error) {
      return <div style={style}>error,{loader.error.message}<span onClick={() => loader.refresh()}>reload</span></div>
    } else {
      return <div style={style}>empty,<span onClick={() => loader.refresh()}>reload</span></div>
    }
  }
}