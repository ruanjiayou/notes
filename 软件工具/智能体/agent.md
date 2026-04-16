#

## gemini api
  ```
  名称: gemini_api_key
  秘钥: AIzaSyAt2hblDo11A_uQdH_MqA9mNcCtJckINBo
  项目名称 projects/417238767976
  项目编号 417238767976
  ```
- 美国街道信息：4652 Prairie Clover Drive
- 个人 • 美国 • ID：4536-5544-8162
- 6225 7686 8914 0059

## openRouter
```
name: common_api_key
key: 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
```

## chatbox
- License Key: 5a09a4d1-d883-464c-82d5-e50d4944487f

## deepseek
- apikey: sk-7f718709a05c46d7a9ffee7d308cf851

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
- 启动: `npx -y @j0hanz/filesystem-mcp@latest --allow-cwd  /Users/jiayou/projects/ --port 3000`
