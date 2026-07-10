# whisper.cpp
> 效果不如faster-whisper-api

## macos
- 安装构建命令: `brew install cmake`
- git clone https://github.com/ggerganov/whisper.cpp.git
- cd whisper.cpp
- 下载模型: `./models/download-ggml-model.sh large-v3-turbo-q8_0.bin`
- cmake -B build
- 开始构建: `cmake --build build --config Release --target whisper-server`
- ./build/bin/whisper-server --help
- 启动接口服务: `./build/bin/whisper-server -m "$(pwd)/models/ggml-large-v3-turbo-q8_0.bin" --host 0.0.0.0 --port 8080 -t 6 -l zh`
- 