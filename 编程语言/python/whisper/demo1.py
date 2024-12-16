import whisper

# 加载 turbo 模型, 设置使用 cpu,设置使用 FP32
model = whisper.load_model("turbo", device = "CPU", dtype = "float32")
# 设置语言为中文
result = model.transcribe("test1-1.aac", language = "zh")
print(result["text"])

# 生成 SRT 格式的字幕文件
with open("output.srt", "w", encoding="utf-8") as srt_file:
    for i, segment in enumerate(result["segments"]):
        start = segment["start"]
        end = segment["end"]
        text = segment["text"]
        
        # 写入 SRT 内容
        srt_file.write(f"{start} --> {end}\n{text.strip()}\n")