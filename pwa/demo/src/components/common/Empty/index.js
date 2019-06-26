import React from 'react';

export default function renderEmpty(loader, options) {
  if (loader.isEmpty) {
    if (loader.isLoading) {
      return <div>加载中...</div>
    } else if (loader.error) {
      return <div>error,{loader.error.message}<span onClick={() => loader.refresh()}>reload</span></div>
    } else {
      return <div>empty,<span onClick={() => loader.refresh()}>reload</span></div>
    }
  }
}