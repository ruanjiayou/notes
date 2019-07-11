import React from 'react';
import { Observer, useLocalStore } from 'mobx-react-lite';
import { useContext } from '../../../contexts/routerContext';
import { InputItem, List, Button, Toast } from 'antd-mobile';

import services from '../../../services';
import storage from '../../../utils/storage';

import './index.css';

async function login(router, store) {
  if (store.account && store.password) {
    store.isLoading = true;
    let res = await services.login(store);
    store.isLoading = false;
    if (!res) {
      return Toast.info('请求失败!');
    }
    if (res.code !== 0) {
      return Toast.info(res.message);
    } else {
      storage.setValue('access-token', res.data.token);
      router.history.push({
        pathname: '/'
      });
    }
  } else {
    Toast.info('请输入账号密码!');
  }
}

export default function ({ self }) {
  let router = useContext();
  let store = useLocalStore(() => ({
    isLoading: false,
    account: '',
    password: ''
  }));
  return <Observer>
    {() => {
      return <div className="dd-common-centerXY">
        <List>
          <List.Item>
            <InputItem
              type="text"
              placeholder="用户名"
              style={{ border: '0 none' }}
              defaultValue={store.account}
              onBlur={value => store.account = value}
            >
              用户名
            </InputItem>
          </List.Item>
          <List.Item>
            <InputItem
              type="password"
              placeholder="密码"
              defaultValue=""
              style={{ border: '0 none' }}
              onBlur={value => store.password = value}
            >
              密码
            </InputItem>
          </List.Item>
          <List.Item>
            <Button loading={store.isLoading} disabled={store.isLoading} type="primary" onClick={() => login(router, store)}>登录</Button>
          </List.Item>
        </List>
      </div>
    }}
  </Observer>
}