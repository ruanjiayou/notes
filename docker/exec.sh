#!/bin/bash
# chmod u+x ./exec.sh
# 用法示例: ./exec.sh <container_id|name> "cd /root && ls -a"
#                                        "mongodump -u root -p 123456 --authenticationDatabase admin --db cms-manager -o /data/backup/2025-03-04"
#                                        "mongorestore -u root -p 123456 --authenticationDatabase admin --db cms-manager '/data/backup/2025-03-04/cms-manager'"

# 配置
base_url=""
# 判断系统类型
if [ "$(uname)" = "Darwin" ]; then
  param="-s --unix-socket /var/run/docker.sock"
  base_url="http://localhost"
else
  param=""
  base_url="http://192.168.0.124:2375"
fi

# 检查参数数量
if [ $# -lt 2 ]; then
  echo "Usage: $0 <container_id> \"<command>\""
  exit 1
fi

# 容器和命令
container_id="$1"
shift
cmd="$@"

# 生成 JSON payload（手动构造 JSON）
payload="{\"AttachStdout\": true, \"AttachStderr\": true, \"Cmd\": [\"sh\", \"-c\", \"$cmd\"]}"

# 调用 /containers/:id/exec 接口创建 exec 实例
response=$(curl $param \
  -H "Content-Type: application/json" \
  -d "$payload" \
  -X POST "${base_url}/containers/${container_id}/exec")

# 解析返回的 exec_id（使用 grep 和 sed 提取 JSON 字段）
exec_id=$(echo "$response" | grep -o '"Id":"[^"]*"' | sed -E 's/"Id":"([^"]*)"/\1/')

if [ -z "$exec_id" ]; then
  echo "创建 exec 实例失败. 返回信息: $response"
  exit 1
fi

echo "创建 exec 实例成功: $exec_id"

# 调用 /exec/:id/start 接口启动 exec 实例
start_payload='{"Detach": false, "Tty": false}'
result=$(curl $param \
  -H "Content-Type: application/json" \
  -d "$start_payload" \
  -X POST "${base_url}/exec/${exec_id}/start")

# 输出命令执行结果
echo "$result"
