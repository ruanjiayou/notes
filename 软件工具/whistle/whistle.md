# whistle

## [安装环境](https://wproxy.org/whistle/install.html)
- sudo npm install -g whistle
- 下载证书是在`http://127.0.0.1:8899/#network`的https
- 导入证书是在`chrome://settings/certificates?search=证书`的权威机构

## 注意
- values里的key-value在rules中{key}不能拼接, 因为直接被替换为value了
## 修改响应头
### 方式一
> rules中加个测试resHeaders的rule，rule的规则如下
```
$https://090d-112-95-173-153.ngrok.io/ resHeaders:///Users/jiayou/projects/notes/whistle/data/csp.json
```
### 方式二
> values中添加一个csp的value, value值如下
```
{
  "content-security-policy": "base-uri 'self'"
}
```
rules中加个测试resHeaders的rule，rule的规则如下
```
$https://090d-112-95-173-153.ngrok.io/dashboard resHeaders://{csp}
```

## 2024-11-27 20:39
- npm i -g whistle
- whistle start -p 8899 -P 8898
- 设置系统代理为设置的地址(如 127.0.0.1:8899)
- 访问控制台ui地址(如 http://192.168.0.125:8899/)
- 点击顶部一栏中的https，点击二维码(并且设置允许https)，并下载安装到信任的根证书
- 转发到蓝灯vpn
  - 界面中rules的Default 写入 `* proxy://192.168.0.125:8888`
  - 访问google看到请求详情
- 