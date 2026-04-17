# router

## 路由设计

- 默认基础路由: /redirect, /login, /auth-redirect, /404, /401, 空, /guide
- 异步路由(可分割到单个路由模块文件)
- layout组件: 页面的骨架. 大多数route中,component是layout, 页面是layout的子path
- route的成员
  - hidden: true 不在侧边栏显示
  - alwaysShow
  - redirect: noredirect 在位置导航中不会重定向
  - name keep-alive功能要求必须设置
  - meta
    - roles 有权限的角色数组
    - title 侧边栏菜单和位置导航的名称
    - icon 图标
    - noCache 页面是否缓存

```js
import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)

import Layout from '@/views/layout/Layout'
// import chartsRouter from './modules/charts'

export const constantRouteMap = [
  {
    path: 'redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path*',
        component: ()=>import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: ()=>import('@/views/login/authredirect'),
    hidden: true
  },
  {
    path: '/404',
    component: ()=>import('@/views/errorPage/404'),
    hidden: true
  },
  {
    path: '/401',
    component: ()=>import('@/views/errorPage/401'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    children: [
      {
        path: 'dashboard',
        component: ()=>import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: { title: 'bashboard',icon:'dashboard',noCache: true}
      }
    ]
  },
  {
    path: '/guide',
    compoonent: Layout,
    redirect: '/guide/index',
    children: [
      {
        path: 'index',
        component:()=>import('@/views/guide/index'),
        name: 'Guide',
        meta: {title: 'guide', icon: 'guide', noCache: true }
      }
    ]
  }
]

export default new Router({
  scrollBehavior: ()=>({y:0}),
  routes: constantRouterMap
})

export const asyncRouterMap = [
  {
    path: '/icon',
    component: Layout,
    children: [
      {
        path: 'index',
        component: ()=>import('@/views/svg-icons/index'),
        name: 'Icons',
        meta: { title: 'icons',icon:'icon',noCache: true}
      }
    ]
  },
  // chartsRouter,
  // example
  {
    path: '/tab',
    component: Layout,
    children: [
      {
        path: 'index',
        component: ()=>import('@/views/tab/index'),
        name: 'Tab',
        meta: { title: 'tab',icon:'tab',noCache: true}
      }
    ]
  },
  {
    path: '/error',
    component: Layout,
    name: 'ErrorPages',
    redirect: 'noredirect',
    meta: {
      title: 'errorPages',
      icon: '404'
    }
    children: [
      {
        path: '401',
        component: ()=>import('@/views/errorPage/401'),
        name: 'Page401',
        meta: { title: 'page401',noCache: true}
      },
      {
        path: '404',
        component: ()=>import('@/views/errorPage/404'),
        name: 'Page404',
        meta: { title: 'page404',noCache: true}
      }
    ]
  },
  {
    path: '/theme',
    component: Layout,
    redirect: 'noredirect',
    children: [
      {
        path: 'index',
        component: ()=>import('@/views/theme/index'),
        name: 'Theme',
        meta: { title: 'theme',icon:'theme',noCache: true}
      }
    ]
  },
  {
    path: '/i18n',
    component: Layout,
    children: [
      {
        path: 'index',
        component: ()=>import('@/views/i18n-demo/index'),
        name: 'I18n',
        meta: { title: 'i18n',icon:'international',noCache: true}
      }
    ]
  },
  {
    path: 'external-link',
    component: Layout,
    children: [
      {
        path: 'https://github.com/PanJiaChen/vue-element-admin',
        meta: {title: 'externalLink',icon: 'link'}
      }
    ]
  }
  {
    path: '*',
    redirect: '/404',
    hidden: true
  }
]
```