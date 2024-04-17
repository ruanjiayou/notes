# xcode

## 快捷键
- 折叠: cmd+alt+左箭头
- 展开: cmd+alt+右箭头
- 打开关闭预览: cmd+alt+enter

## app信任 http
- plist 增加
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

- 不显示日志: 重启 xcode;设置 build debugger 模式
- Info.plist 多次执行,文件重复: 将Build Phase 里的 copy 删除