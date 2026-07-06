# 制作应用

## 制作可执行文件
- bun build --compile --target=bun-darwin-arm64 ./api/server.ts --outfile ./yolo-label/yolo-label-darwin-arm64
- bun build --compile --target=bun-darwin-x64 ./api/server.ts --outfile ./yolo-label/yolo-label-darwin-x64
- bun build --compile --target=bun-linux-x64 ./api/server.ts --outfile ./yolo-label/yolo-label-linux-x64
- bun build --compile --target=bun-linux-arm64 ./api/server.ts --outfile ./yolo-label/yolo-label-linux-arm64
- bun build --compile --target=bun-windows-x64 ./api/server.ts --outfile ./yolo-label/yolo-label-windows-x64

## macOS制作镜像
- bun install create-dmg
- 创建应用骨架: `mkdir -p MyApp.app/Contents/{MacOS,Resources}`
- 执行文件与应用同名: `cp /path/to/your/MyApp MyApp.app/Contents/MacOS/MyApp`
- 创建配置文件: `touch MyApp.app/Contents/Info.plist`
- ~~codesign --deep --force MyApp.app~~
- create-dmg MyApp --no-code-sign