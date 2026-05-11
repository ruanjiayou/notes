# cloudflare

## cloudflared
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
  - 配置域名与转发端口
  ```yml
  tunnel: <你的隧道ID>
  credentials-file: /root/.cloudflared/<隧道ID>.json

  ingress:
    - hostname: your-domain.com   # 替换为你的域名，如 web.example.com
      service: http://localhost:8080
    - service: http_status:404
  ```
- 运行: cloudflared tunnel run [name]

## wrangler
- npm i -g wrangler
- npm wrangler deploy [project] 