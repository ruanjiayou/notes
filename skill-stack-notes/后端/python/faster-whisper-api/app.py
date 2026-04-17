from flask import Flask, request, jsonify
from faster_whisper import WhisperModel

app = Flask(__name__)

# 初始化模型 如果未下载会自动下载.可以先下载到本地,指定本地路径
model = WhisperModel("large-v2", device="cpu")


@app.route("/transcribe", methods=["POST"])
def transcribe():
    print("start")
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    lang = request.args.get("lang", default="zh", type=str)
    audio_file = request.files["audio"]

    # 将 segments 转换为 JSON 格式
    result = []
    segments, _ = model.transcribe(
        audio_file, language=lang, beam_size=5, word_timestamps=True)
    for segment in segments:
        result.append(
            {
                "start": segment.start,  # 起始时间
                "end": segment.end,  # 结束时间
                "text": segment.text,  # 转录文本
            }
        )
    return jsonify({"segments": result}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8099)
    print("launched at 8099")
