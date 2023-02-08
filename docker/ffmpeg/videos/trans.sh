# ffmepg的docker形式
# docker run -v "/Users/jiayou/projects/notes/docker/ffmpeg/videos:/data/videos" jrottenberg/ffmpeg:4.1-alpine 

# mp4转m3u8
-i /data/videos/-.mp4  -codec copy -vbsf h264_mp4toannexb -map 0 -f segment -segment_list /data/videos/m3u8/test.m3u8 -segment_time 5 /data/videos/m3u8/p_%03d.ts

# m3u8转mp4
-allowed_extensions ALL -movflags faststart -protocol_whitelist "file,http,crypto,tcp" -i /data/videos/m3u8/test.m3u8  -codec copy /data/videos/mp4/test.mp4
# 元信息放文件开头 -movflags faststart

# 截图
-ss 5.1 -i /data/videos/-.mp4  -s 320x240 -frames:v 1 -f image2 /data/videos/screenshots/test.png
-ss 5.1 -i /data/videos/-.mp4  -frames:v 1 -f image2 /data/videos/screenshots/test2.png

# 截取gif
-ss 5.0 -t 2 -r 16 -i /data/videos/-.mp4 -f gif /data/videos/screenshots/test.gif

docker run -v "/Users/jiayou/projects/notes/docker/ffmpeg/videos:/data/videos" jrottenberg/ffmpeg:4.1-alpine -allowed_extensions ALL -protocol_whitelist "file,http,crypto,tcp" -i /data/videos/m3u8/test.m3u8  -codec copy -movflags faststart /data/videos/mp4/test.mp4
docker run -v "$PWD:/videos" jrottenberg/ffmpeg:4.1-alpine -allowed_extensions ALL -protocol_whitelist "file,http,crypto,tcp" -i /videos/m3u8/test.m3u8  -codec copy -movflags faststart /videos/mp4/test.mp4