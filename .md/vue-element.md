# vue-element-admin

vue语法
- 插值(可用表达式)与过滤: 文本, {{}}, html v-html="var"
  > {{ number + 1 }} <br>
  > \<span v-html="result.text"></span>
- 指令(属性或事件): v-前缀(v-if/v-bind/v-on/v-for/v-else/v-else-if/v-show/v-model/)
  > v-on:href="url" 缩写 :href="url" <br>
  >  v-bind:click="clk" 缩写 @click="clk" <br>
- 自定义指令: 钩子函数 bind()/inserted()/udpate()/componentUpdated()/unbind()/
- 修饰符: v-on:submit.prevent="onSubmit" v-model.lazy="msg"
- 计算属性(是缓存)vs方法: 只在相关依赖发生改变时它们才会重新求值.两者按实际场景选用合适都
- vue对class和style属性做了专门都增强,可以是数组和对象.style还有多重值都支持
- 

- webpack+babel+eslint配置
- 路由: 嵌套路由/子路由/动态路由/懒加载路由/路由元信息/滚动行为/过渡效果 事件顺序 historyAPI
- 组件: 传值/slot/element-ui
- mock
- *store
- 其他基础: css预处理器 i18n dom 

<details>
  <summary>论数据保存与通信</summary>

- `data`,`prop`,`event`/`on`,`event bus`, `vuex`

```
页面或组件间共享: vuex
父子组件: evnet/on
跨组件: event bus
组件内: data
```
<details>

<details>
  <summary>从登陆开始(上面后台勉强够用)</summary>

- 界面: `element-ui`
- 事件: `@click.native.prevent="handleLogin"`
- 验证: `validate`
- 请求: store中的actions调用api中的获取数据.
- 设置token
- 跳转
- permission: router监控(白名单和token的验证)
```js
// store
// vuex 这样约定的好处是，我们能够记录所有 store 中发生的 state 改变，同时实现能做到记录变更 (mutation)、保存状态快照、历史回滚/时光旅行的先进的调试工具。
state/mutations/actions
事件中通过$store.dispatch()调用actions
actions通过commit调用mutations的方法
mutations的方法是用于修改state的
```
```js
// store
 handleLogin() {
  this.$refs.loginForm.validate(valid=>{
    if(valid) {
      this.loading = true
      this.$store.dispatch('LoginByName', this.loginForm /* data的数据 */).then(()=>{
        this.loading = false
        this.$router.push({path: this.redirect || '/' })
      }).catch(()=>{
        this.loading = false
      })
    } else {
      console.log('error submit!')
      return false
    }
  })
}

// 全局变量
handleLogin2() {
  this.$refs.loginForm.validate(valid => {
    if (valid) {
      loginByUsername(this.loginForm.username, this.loginForm.password).then((response) => {
        globalData.user = response.data.data
        globalData.token = response.data.token
        setToken(globalData.token)
        this.loading = false
        this.$router.push({ path: this.redirect || '/' })
      }).catch(() => {
        this.loading = false
      })
    }
  })
}
```
</details>

## 添加一个新页面
- view添加qr-code文件夹,index.vue文件
- router中添加路由
  ```js
  {
    path: '',
    name: '',
    component: () => import('@/views/qr-code/index'),
    meta: { title: 'qr-code' }
  }
  ```
- permission的处理
- eslint和format冲突...(改配置)