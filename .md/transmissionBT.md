# transmission

- 在~/.config/transmission/blocklist文件夹下
- 每行按: `Localhost:127.0.0.1-127.0.0.1`格式写好blocklist文件
- vim ~/.config/transmission/settings.json
  ```
  "blocklist-enabled": true,
  "blocklist-updates-enabled": false
  ```