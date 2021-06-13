# react

## 模块化
- 指解决一个复杂问题时自顶向下逐层把系统划分成若干模块的过程

## 组件化
- 就是有特定功能的,业务逻辑紧密的代码,封装在一起,便于开发和维护,降低整个系统的耦合度

## 虚拟DOM
- 是js模拟真实DOM的数据,包含DOM的所有信息.数据更新会进行优,速度快代价小
## 生命周期 16.3之前和之后
- 初始化
- mounting
  - constructor
  - componentWillMount
  - componentDidMount
- updating
  - 16.4 getDerivedStateFromProps 阻止访问this.props
    - componentWillReceiveProps(nextProps) 接收到父组件的新props
    - shouldComponentUpdate 调用setState后state发生变化,return false可以阻止更新
  - 16.4 getSnapshotBeforeUpdate WillUpdate和DidUpdate 两个函数读取的dom可能不一致
  - componentWillUpdate
  - render diff算法比较新旧DOM树并渲染更改后的节点
  - componentDidUpdate(preprops, preState)
- unmounting
  - componentWillUnmount 卸载前调用,用于清除定时器或监听器

## 受控组件和非受控组件
- 受控组件没有自己的状态,由父组件传的props控制
- 非受控组件有自己的状态,数据通过DOM控制,通过Ref获取DOM
- 表单验证用非受控组件好些,可以自定义验证

## 高阶组件
> 接受一个组件作为参数，并返回一个新的组件
- 抽取通用状态,组件复用,
- 自定义渲染
- 

## key
- 用于虚拟DOM计算中识别,优化渲染,提高性能,key变了会重新生成

## redux
- createStore,store.getState(),store.dispatch(),store.subscribe()
- 创建store
- store生成快照state
- 用户通过view向store发出action dispatch,生成新的state(reducer过程,)
- 异步 redux-thunk/redux-promise

## react-redux
- connect()
- 

## Redux与Flux有何不同
- Redux Store 和更改逻辑是分开的,只有一个store,状态不可改变
- 组件或页面间需要数据共享时,方便测试

## react-router4
> 前端路由本质: 两种方法,#之后发生变化,historyAPI提供的方法
- 当浏览器的url产生变化,不刷新,产生类似页面跳转等效果

## 函数组件和类组件
- 函数组件的性能比类组件的性能要高，因为类组件使用的时候要实例化

## React事件处理
- 对原生事件进行了包装
- 

## 组件通信
- 父子组件:props传递
- 兄弟组件:父组件提供的函数修改props
- 跨组件: context/组件UI外的数据/事件

## 性能优化
- cdn,PWA可以使用缓存策略
- 按需加载
- 减少文件数量,压缩文件和gzip
- DNS预请求
- 

## JSX
- JSX即JavaScript XML。一种在React组件内部构建标签的类XML语法
- JSX语法糖允许前端开发者使用我们最熟悉的类HTML标签语法来创建虚拟DOM在降低学习成本的同时，也提升了研发效率与研发体验

## hook 16.8
- 用于状态管理和代替生命函数,特别是函数组件里没有生命周期函数
- 更容易复用,(原来通过高阶组件复用都是方法提升到最顶层)
- 写代码效率更高,
- 钩子
  - useState,必须在useEffect里才能有setState的效果
  - useMemo 和 useCallback仅仅 依赖数据 发生变化, 才会重新计算结果，也就是起到缓存的作用.前者缓存值,后者缓存函数.

## 优化
- 减少请求,合并文件,压缩文件.http2和预加载,预解析DNS
- 事件委托/
- 前端日志分析
- 
- 按需加载
- 缓存,请求头
- CDN

## 注意
- 在ES6中，在子类的 constructor 中必须先调用 super 才能引用 this
