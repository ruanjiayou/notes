# cloudflare

- godaddy域名的 dns 解析切换到 cloudflare.(改nameserver)
- 安装 cloudflared 并创建 tunnel
  ```sh
  brew install cloudflared
  cloudflared --version
  cloudflared tunnel login  (选择域名并授权)
  cloudflared tunnel create dev
  cloudflared tunnel route dns dev game.jiayou.work
  ```
  /Users/jiayou/.cloudflared/e710b6a8-ceaf-41ab-a779-20b71065934c.json