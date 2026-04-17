#

## lobehub本地部署
- docker pull lobehub/lobehub:canary
- brew install wget
- mkdir lobehub && cb lobehub
- bash <(curl -fsSL https://lobe.li/setup.sh) -l zh_CN
- 测试: docker compose up --no-attach searxng
- docker compose up -d --no-attach searxng

## mcp 
- stdio 格式是本地执行shell的方式
- SSE是http event
- streamable http

### MCP Inspector
> 调试测试MCP
- 启动: npx @modelcontextprotocol/inspector
- 测试stdio: 
  ```
  command: npx
  arguments: -y @j0hanz/filesystem-mcp@latest --allow-cwd
  ```
### @j0hanz/filesystem-mcp
- 启动: `FILESYSTEM_MCP_API_KEY=123456 FILESYSTEM_MCP_HTTP_HOST=0.0.0.0 npx -y @j0hanz/filesystem-mcp@latest --transport streamable-http --allow-cwd  /Users/jiayou/projects/ --port 8811`

### streamable http
- `docker run -d --name mcp-server --network lobehub_lobe-network -p 3001:3001 node:24-alpine npx -y @modelcontextprotocol/server-everything streamableHttp`