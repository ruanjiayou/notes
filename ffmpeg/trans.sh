# ffmepg的docker形式
## alias
> 添加alias后可以快速使用,抽取音频: ff -i input.mp4 -vn output.mp3
- linux
  > `alias ff="docker run -v $PWD:/data -w /data jrottenberg/ffmpeg:4.1-alpine -hide_banner $@"`
- powershell
  > `function ff() { docker run -v /c/Users/Administrator/Downloads:/data -w /data --name temp jrottenberg/ffmpeg:4.1-alpine -hide_banner $args; docker rm temp }`

# mp4转m3u8
-i /data/videos/-.mp4  -codec copy -vbsf h264_mp4toannexb -map 0 -f segment -segment_list /data/videos/m3u8/test.m3u8 -segment_time 5 /data/videos/m3u8/p_%03d.ts

# m3u8转mp4 应该先 protocal_whitelist 再 allowed_extions 接着 -i 不然可能出错
-i /data/videos/m3u8/test.m3u8 -allowed_extensions ALL -movflags faststart -protocol_whitelist file,tls,tcp,https,crypto -c copy /data/videos/mp4/test.mp4
# 元信息放文件开头 -movflags faststart

# 剪切视频
-i example.mp4 -ss 5m -t 10m output.mp4

# 截图
-ss 5.1 -i /data/videos/-.mp4  -s 320x240 -frames:v 1 -f image2 /data/videos/screenshots/test.png
-ss 5.1 -i /data/videos/-.mp4  -frames:v 1 -f image2 /data/videos/screenshots/test2.png

# 截取gif
-ss 5.0 -t 2 -r 16 -i /data/videos/-.mp4 -f gif /data/videos/screenshots/test.gif

# 抽取音频
-i input.mp4 -vn output.mp3

# 抽取字幕
-i input.mkv -map 0:s:0 subs.srt
# 合并音频和视频
-i input.mp4 -i input.mp3 -c:v copy -c:a copy output.mp4

# 合并两个视频(第一个的视频第二个的音频)
## map M:N M是第几个输入文件，N的该文件的第几个流
-i input1.mp4 -i input2.mp4 -movflags faststart -c copy -map 0:0 -map 1:0 output.mp4 -y

# 将图片写入视频或音频的封面
-i input_video.mp4 -i input_image.png -map 0 -map 1 -c copy -c:v:1 png -disposition:v:1 attached_pic output_video.mp4

# stream

# 合并字幕
-i input.mp4 -i sub.srt -c:s mov_text -c:v copy -c:a copy output.mp4

# 设置请求头
-headers "origin: http://www.baidu.com\r\nreferer: http://www.baidu.com"

# 设置代理
-http_proxy "http://localhost:55173"

# h264 (profile: baseline->低性能设备,main->支持B帧,high->压缩率最高,高性能设备 level: 3.1->720p,4.0->1080p,4.1->高比特率 1080p,5.0->4k)
-i input.mp4 -c:v libx264 -profile:v high -level 4.1 -c:a aac output.mp4
# h265 (profile: main->8位颜色深度,main10->10位深度,level: 4.0->1080p,5.0->4k)
-i input.mp4 -c:v libx265 -profile:v main -level:v 4.0 -c:a aac output.mp4

# 设置视频码率
-i input.mp4 -b:v 2000k output.mp4
# 设置音频码率
-i input.mp4 -b: 128k output.mp4
# 可变码率(0-51,越小质量越高,18-23 是高质量范围)
-i input.mp4 -c:v libx264 -crf 23 output.mp4
# 直播或流媒体中限制码率波动
https://www.zhihu.com/people/linuxsao-di-seng
