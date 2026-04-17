# vue面试

## 生命周期
- new Vue() 生成实例
- 事件和生命周期钩子初始化
- 调用beforeCreate
- 初始化inject provide state属性
- 调用created data初始化,computed/event/watch调用 dom未挂载
- 是否有el对象,无则挂载vm.$mount
- 是否有模板
- 有则转化为render函数,无则编译el对象外层html为模板
- 调用beforeMount,调用前render函数首次调用生成虚拟dom
- 将$el替换为真正的dom
- 调用mounted
- 数据有更新就调用beforeUpdate
- 重新渲染dom后调用updated
- 实例销毁前(vm.$destroy)调用beforeDestroy
- 清除watcher 子组件事件监听器
- 组件销毁后调用destroyed

## 指令(v-开头)
- v-for
- v-if/v-else
- v-show 
- v-bind html原生属性,缩写 :(冒号)
- v-on 绑定事件,缩写 @
  - 修饰符 submit.prevent 
  - .stop
  - .capture
  - .once
  - .passive
- v-model
  - .lazy
  - .number
  - .trim
- v-text
- v-html
- v-pre
- v-cloak
- v-once
- 

## 通信方式
- 父组件通过:data传值
- 子组件通过props传值
- 子组件通过$emit方法传值

## computed和watch的区别
- computed依赖属性值变化,下一次取值才重新计算
- watch 监听的数据变化时都会执行回调,可以做其他事
## 原理
- 通过MVVM模型,数据驱动
