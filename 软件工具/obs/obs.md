# obs

## 流程
> 创建配置文件,创建常见,创建来源(视频流/音频流),开始直播(录制是保存到本地)
- 配置文件: 阿里云是自定义类型,服务器地址的 domain/appname,密匙是通道名
- 来源: 录屏,录制窗口,媒体文件

## 播放直播
- ffplay http://your-server:8080/hls/test.m3u8(或test.flv)
- 网页播放 https://video.aliyuncs.com/player/setting/setting.html
- Chrome插件直接播放: HLS Player

## 问题
- 直播竖屏: 选择来源,右键设置使用此源的尺寸作为输出分辨率
