# curl使用笔记
> 语法: curl [option] [url]
- 显示url的内容: `curl http://www.baidu.com`
- linux重定向保存: `curl http://www.baidu.com >> index.html`
- -o参数保存: `curl -o index.html http://www.baidu.com`
- -O参数保存: `curl -O http://www.baidu.com`
- 指定代理: `curl -x ip:port url`

## 参数
- 指定用户代理: `-A "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.0)"`
- 使用cookie: `-b cookie.txt`
- 保存cookie: `-c cookie.txt`
- 断点续传: `-C -O`
- post的数据: `-d "k1=v1&k2=v2或者json字符串格式"`
- 保存header: `-D header.txt`
- 伪造referer: `-e www.baidu.com`
- 显示抓取错误: `-f`
- 显示header和文档: `-i`
- 只显示header: `-I`
- 不使用https: `-k`
- 指定文件名保存: `-o [name].[ext]`
- 循环下载: `-O [1-5] {}`
- 分块下载: -r
- 重试次数: `--retry n`
- 重试的间隔: `--retry-delay`
- 上传文件: `-T path-to-file`
- 设置代理: `-x ip:port`
- 设置头: `-H "Host: 127.0.0.1:3000"`

参考:
- https://www.jianshu.com/p/07c4dddae43a
- https://www.cnblogs.com/doseoer/p/7044344.html
- http://man.linuxde.net/curl