
## charles抓不到命令行执行的curl包?
- `curl -x 127.0.0.1:8888 https://www.sogou.com`
- 龟速可以在proxy的throttle菜单设置具体数值
- android7开始不信任用户安装的证书了,除非安装的包修改配置的安全参数
- ios: 电脑安装根证书(过期了需要重置)=>信任=>允许proxy的macOS proxy=> 配置HTTPS端口=> ios配置代理=> 访问chls.pro/ssl安装证书=>vpn和证书里安装(改为设置里查看安装描述文件)=> 手机关于里的通用里设置信任=>
### charles安装的证书过期抓不了 https
- 打开 charles -> Help -> SSL Proxying -> reset root ca,
- SSL Proxying -> 重新安装根证书 -> 钥匙串里设置信任
- 手机设置代理 -> 访问 chls.pro/ssl 下载并安装 -> 信任,关于本机 -> 证书信任设置 -> 信任