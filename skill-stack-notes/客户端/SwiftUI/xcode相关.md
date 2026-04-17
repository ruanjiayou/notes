# xcode

## 快捷键
- 折叠: cmd+alt+左箭头
- 展开: cmd+alt+右箭头
- 打开关闭预览: cmd+alt+enter

## 问题与解决方案
- app信任 http: plist 增加
  ```xml
  <key>NSAppTransportSecurity</key>
  <dict>
      <key>NSExceptionDomains</key>
      <dict>
          <key>example.com</key>
          <dict>
              <key>NSIncludesSubdomains</key>
              <true/>
              <key>NSExceptionAllowsInsecureHTTPLoads</key>
              <true/>
          </dict>
      </dict>
  </dict>
  ```
- 支持后台音频播放: 配置 Info.plist 文件
  ```xml
  <key>UIBackgroundModes</key>
    <array>
        <string>audio</string>
        <!-- 如果需要支持 AirPlay，添加下面这行 -->
        <string>airplay</string>
    </array>
  ```
- 不显示日志: 重启 xcode;设置 build debugger 模式
- Info.plist 多次执行,文件重复: 将Build Phase 里的 copy 删除
- svg 文件不显示的问题: 添加响应头 Content-Type: image/svg+xml