import os
from flask import Flask, request, jsonify
from faster_whisper import WhisperModel

app = Flask(__name__)

# ==================== 🛠️ 针对 Intel CPU 的核心配置优化 ====================
# 1. 强制启用 int8 量化：内存占用直接减半（从 3GB 降到 1.5GB 左右），且 CPU 计算整数速度暴增
# 2. cpu_threads=6：精准吃满你 Intel i5 的 6 个物理核心
model = WhisperModel(
    "large-v3-turbo",       # 强烈推荐 large-v3-turbo，准确率持平 large-v2 但速度快 2-3 倍
    device="cpu",
    compute_type="int8",    # 极其重要：CPU 运行必须量化
    cpu_threads=6           # 极其重要：匹配你的 6 核 CPU
)
# ====================================================================

@app.route("/transcribe", methods=["POST"])
def transcribe():
    print("收到转写请求，开始处理...")
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
        
    lang = request.args.get("lang", default="zh", type=str)
    audio_file = request.files["audio"]

    # 临时保存上传的文件，因为 faster-whisper 传入文件路径或二进制流时，部分格式需要底层探测
    # 显式保存为本地临时文件可以避免某些特殊的音频流导致底层 C++ 报错
    temp_path = "temp_upload_audio.wav"
    audio_file.save(temp_path)

    try:
        # standard 级别的 beam_size=5 效果最好
        # vad_filter=True 是 faster-whisper 的王牌功能：自动切除大段静音和噪音，彻底杜绝幻觉
        segments, info = model.transcribe(
            temp_path, 
            language=lang, 
            beam_size=5, 
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500)
        )
        
        result = []
        for segment in segments:
            # 打印进度，防止长音频处理时后台看起来像死机一样
            print(f"[{segment.start:.2f}s -> {segment.end:.2f}s]: {segment.text}")
            result.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
            })
            
        return jsonify({
            "language": info.language,
            "language_probability": info.language_probability,
            "segments": result
        }), 200

    except Exception as e:
        print(f"转写出错: {str(e)}")
        return jsonify({"error": str(e)}), 500
        
    finally:
        # 记得清理临时文件
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    # Flask 默认是单线程阻塞的，跑 ASR 这种重度 CPU 任务时，
    # 建议保持 threaded=False，确保同一时间只有一个请求在全力榨干 6 核 CPU
    app.run(host="0.0.0.0", port=8099, threaded=False)