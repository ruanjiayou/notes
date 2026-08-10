# cloudflare

## cloudflared
- godaddy域名的 dns 解析切换到 cloudflare.(改nameserver)
- 安装 cloudflared 并创建 tunnel
- 登录: cloudflare login
- 查询: `cloudflared tunnel list`
- 创建隧道: `cloudflared tunnel create ugos-pro` 
- 临时运行: `cloudflared tunnel run [name]`
- 启动服务: `sudo systemctl start cloudflared`
- 停止服务: `sudo systemctl stop cloudflared`
- 设置开机自启: `sudo systemctl enable cloudflared`
- 检查是否成功运行: `sudo systemctl status cloudflared`
- 本地配置模式
  - 编辑配置文件: `sudo vim /etc/cloudflared/config.yml`
    ```yml
    # 1. 填入隧道名或隧道的 UUID（之前创建隧道时生成的 UUID，可通过 cloudflared tunnel list 查看）
    tunnel: 525f47bf-xxxx-xxxx-xxxx-cc1accdc7618 
    # 2. 填入你本地凭证文件的绝对路径（默认在 root 目录下）
    credentials-file: /root/.cloudflared/525f47bf-xxxx-xxxx-xxxx-cc1accdc7618.json

    # 3. 强制指定对国内网络友好的协议
    protocol: http2

    # 4. 配置流量转发规则（Ingress）
    ingress:
      # 映射你的阅读器服务
      - hostname: jiayou.work
        service: http://192.168.1.124:80
      # 【必须加】最后一行作为兜底，捕获所有未匹配的流量返回 404
      - service: http_status:404
    ```
  - 绑定根域名: `cloudflared tunnel route dns ugos-pro jiayou.work`
  - 将本地隧道注册为 Systemd 系统服务: `sudo cloudflared --config /etc/cloudflared/config.yml service install`
- 云端token管理模式
  - 卸载服务: `sudo cloudflared service uninstall`
  - 重新安装: `sudo cloudflared service install [token]`

## wrangler
- npm i -g wrangler
- npm wrangler deploy [project] 

## cdn
> api刷新cf的cdn
- 申请token(Permissions的Zone Cache Purge和Zone Resources)
- 到域名详情页获取zone_id
- 调用接口
  ```sh
  export $(cat .env | xargs)
  curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
      -H "Authorization: Bearer ${CF_CDN_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '{"files":["https://jiayou.work/drawer-menu.js"]}'
  ```
  `--data '{"purge_everything": true}'`是删除全部