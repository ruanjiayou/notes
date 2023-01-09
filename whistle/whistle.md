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