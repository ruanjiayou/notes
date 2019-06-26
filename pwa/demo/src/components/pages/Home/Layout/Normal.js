import React, { Fragment } from 'react';
import { Observer } from 'mobx-react-lite';
import { TabBar } from 'antd-mobile';
import { useContext } from '../../../../contexts/routerContext';
import MIcon from '../../../common/MIcon'

import config from '../../../../config';
import store from '../../../../global-state'

export default function ({ children }) {
  let router = useContext();
  return <Observer>
    {() => {
      return <Fragment>
        <TabBar
          tintColor="#33A3F4"
          unselectedTintColor="#888"
          tabBarPosition="bottom"
          barTintColor="white"
        >
          {config.menus.map(menu => {
            return <TabBar.Item
              title={menu.title}
              key={menu.name}
              icon={<MIcon type={menu.icon} />}
              selectedIcon={<MIcon type={menu.icon} />}
              selected={menu.name === store.app.selectedMenu}
              onPress={() => {
                store.app.setMenu(menu.name);
                router.history.push({
                  pathname: `/root/${menu.name}`
                });
              }}
            >
              {children}
            </TabBar.Item>
          })}
        </TabBar>
      </Fragment>
    }}
  </Observer>
}