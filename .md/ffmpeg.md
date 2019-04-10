## ffmpeg

- 查看视频信息: 
  - 详细: `ffmpeg -i xxx.mp4`, `ffprobe xxxx.mp4`
  - 查看视频时长: `ffprobe -v quiet -select_streams v -show_entries stream=duration -of csv="p=0" xxx.mp4`
- 转换格式: `ffmpeg -i 'xxx.mp4' -c:v libx264  -preset ultrafast -vf format=yuvj420p -c:a copy 2.mp4`
- 指定宽高输出: `ffmpeg -y -i Titanic.mkv -s 640*480 out.h264`
- 截取素材
  - 截取gif,从25秒开始,截取10秒,帧率16: `ffmpeg -ss 25 -t 10 -r 16 -i path-to-vedio -f gif test.gif` 
  - 截图: `ffmpeg -ss 16.1 -i path-to-video -s 320x240 -vframes 1 -f image2 xxx.jpeg`
  - 
- 合成
  - 多张图片合并为gif: `ffmpeg -f image2 -framerate 5 -i dir/IMG_%d.jpg test2.gif`
  - 添加水印 视频宽度为100,水印宽度为20,位置10,10?比例1?: `ffmpeg -i input.mp4 -i image.png -filter_complex 'overlay=x=10:y=10' output.mp4`
  - 跑马灯: `-filter_complex "overlay='if(gte(t,1), -w+(t-1)*200, NAN)':(main_h-overlay_h)/2"`
  - 添加srt/ass字幕: `ffmpeg -i video.avi -vf subtitles=subtitle.srt(或ass) out.avi`
  - srt转为ass格式: `ffmpeg -i subtitle.srt subtitle.ass`
  - 添加idx/sub字幕: `ffmpeg -i 1.mp4 -i 1.sub -i 1.idx -filter_complex "[0:v][2:s]overlay=0:H-h" -c:v libx264 out.mp4`
  - 同时添加字幕和水印: `ffmpeg -i ganguan.mkv -c:v libx264 -vf "movie=logo.png[wm];[i][wm]overlay=0:0,subtitles=ganguan.srt[out]" ganguan.mp4`
  - 
```
获取视频信息
格式转换/宽高剪裁/质量大小控制
截取图片/截取动图/截取视频
声音混合/加入水印/加入字幕

```