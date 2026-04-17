# react-ant.design

## JSX语法
就个人理解,React是函数式的, `Varname`(函数变量,有成员和方法,返回html标签或组件) 等价于 `<Varname/>`
- 渲染HTML标签用小写,渲染React组件首字母大写
- html标签中, 用className代替class,用htmlFor代替for
- 语法要求一个顶层标签,但又不想多套div: 用`Fragment`
- 阻止组件渲染: `return null;`
- 组件的属性值都是在props中.
  ```js
  function HelloMessage(props) {
    return <h1>Hello {props.name}!</h1>;
  }
  render() {
    return <HelloMessage name="world"/>;
  }
  ```
  设置默认props: `HelloMessage.defaultProps = { name: "World" }`
- 事件: 注意`constructor()`中要绑定`this`或者使用箭头函数(但有性能问题)
  ```js
  // 方式一
  constructor(props) {
    this.handleClick.bind(this);
  }
  handleClick() {

  }
  // 方式二
  handleClick = () => {

  }
  ```
- 事件传参: 推荐后者 
  ```html
  <button onClick={(e) => this.deleteRow(id, e)}>Delete Row</button>
  <button onClick={this.deleteRow.bind(this, id)}>Delete Row</button>
  ```

- 生命周期 componentDidMount componentWillUnmount

## 样式(less)
- .less中导入
  ```js
  @import '~antd/lib/style/themes/default.less';
  ```
  ```js
  @import '~@/utils/utils.less';
  ```
- .js中导入
  ```js
  import styles from './Center.less';
  ```
- .js中使用引用
  ```html
  <div className={styles.classname}></div>
  ```
- style属性中使用
  ```html
  <div style={{ marginTop: 30 }}></div>
  ```
- 左侧固定,右侧自适应
  ```less
  .box {
    display: 'flex'
  }
  .left {
    width: '80px',
  }
  .right {
    flex: 1
  }
  ```
- 水平垂直居中,从上到下排列
  ```less
  .box {
    display: 'flex',
    flex-direction: 'column',
    justify-content: 'center',
    align-items: 'center'
  }
  ```

## 数据
dva和model和mock dva@2以后effects和reducers不能同名,因为dispatch可以调reducers中的方法
- mock文件夹: `channels.js`
  ```js
  export default {
    'GET /api/v1/channel/1': (req, res)=>{},
    'GET /api/v1/channels': (req, res)=>{},
    'POST /api/v1/channel': (req, res)=>{},
    'PUT /api/v1/channel/1': (req, res)=>{}
  }
  ```
- services文件夹: `api.js`
  ```js
  export async function getChannel(id) {
    return request(`/api/v1/channel/${id}`)
  }
  ```
- models文件夹: `channels.js`
  ```js
  export default {
    namespace: 'channel',
    state: {},
    effects: {},
    reducers: {}
  }
  ```
- connect和@connect,dispatch和props
- dva? effects中调用api的函数名和reducers
  > 页面中调用: dispatch({ type: `命名空间/函数名`, payload: {}}), 就是调用对应文件中effects里的函数 \
  > effects中对应函数: call() 调用api的函数名,发起带参数请求 \
  > 成功后: put() 调用reducers,修改state中的数据
  ```js
  @connect(({ login, loading})=>{
    // namespace: login?
    // loading: effects/reducers/state?
  })

  const { dispatch } = this.props;
  dispatch({
    type: 'channel/fetch', // namespace/functionName
    payload: { id: 1}
  })
  ```


## menu
- name和locales的关联
- path一定要; 要显示页面就要component; 子路由就要加routes; name和icon用于菜单显示


## 提示信息
```js
import { notification } from 'antd';

notification.info({
  message: 'click btn',
  description: 'text',
});
```
或者直接
```js
message.warning('text here')
```

## Model
> 自己写按钮传函数,自己的事件里调用props.函数 footer传没用 \
> destroyOnClose={true}

## input
- 用value(不想加事件就onChange={undefined} readOnly),defaultValue不会跟据state更新
- 双向绑定就setState({[key]: value })

## 简单列表
```js
import React, { PureComponent } from 'react';
import { List } from 'antd';

class Page1 extends PureComponent {

  render() {
    const list = [
      {
        id: '1',
        value: 'Racing car sprays burning fuel into crowd.'
      },
      {
        id: '2',
        value: 'Japanese princess to wed commoner.'
      },
      {
        id: '3',
        value: 'Australian walks 100km after outback crash.'
      },
      {
        id: '4',
        value: 'Man charged over missing wedding girl.'
      },
      {
        id: '5',
        value: 'Los Angeles battles huge wildfires.'
      },
    ];
    return (
      <List
        size="large"
        rowKey="id"
        dataSource={list}
        itemLayout="vertical"
        renderItem={item => (
          <List.Item>
            简单列表:{item.value}
          </List.Item>
        )}
      />
    );

  }
}

export default Page1;
```

## 组件传值
- 父子组件
  > 父组件`this.state.text`传到子组件`this.props.text`
  ```js
  // Page.js
  import React, { Component, Fragment } from 'react';
  import PageList from './PageList';

  class Page extends Component {
    state = { text: 'aaa'};
    render() {
      return (
        <Fragment>
          <PageList {...this.state}/>
        </Fragment>
      )
    }
  }
  export default Page;

  // PageList.js
  import React, { Component, Fragment } from 'react';
  class PageList extends Component {
    render() {
      return (
        <Fragment>
          显示: {this.props.text}
        </Fragment>
      )
    }
  }
  export default PageList;
  ```
- 没有类似vue中的compute,只能通过props写if判断

## 表格
- 字段验证: getFieldDecorator的bug
  ```ts
  import React, { Component, Fragment } from 'react';
  import { Form, Input, Button, } from 'antd';

  class PageRequest extends Component {
    handleSubmit = (e) => {
      e.preventDefault();
      this.props.form.validateFields((err, values) => {
        if (!err) {
          console.log('Received values of form: ', values);
        }
      });
    }

    render() {
      const { getFieldDecorator } = this.props.form;
      return (
        <Form onSubmit={this.handleSubmit}>
          <Form.Item
            label="Note"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 12 }} >
            {getFieldDecorator('note', {
              rules: [{ required: true, message: 'Please input your note!' }],
            })(
              <Input />
            )}
          </Form.Item>
          <Form.Item wrapperCol={{ span: 12, offset: 5 }} >
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      );
    }
  }

  const WrappedRegistrationForm = Form.create()(PageRequest);
  export default WrappedRegistrationForm;
  ```

## dva

## 跳转URL
```js
import {withRouter} from "react-router-dom";

export default withRouter(MyComponent);
```