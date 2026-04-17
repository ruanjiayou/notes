- lua 脚本版
  ```lua
  -- 扫描 user:v5:* 返回所有key名称
  local pattern = "user:v5:*"
  local cursor = "0"
  local keys = {}

  repeat
      local result = redis.call("SCAN", cursor, "MATCH", pattern, "COUNT", 100)
      cursor = result[1]
      
      for _, key in ipairs(result[2]) do
          table.insert(keys, key)
      end
  until cursor == "0"

  return keys
  ```
- 云控制台版
  ```shell
  EVAL "local pattern = 'user:v5:*'\nlocal cursor = '0'\nlocal keys = {}\nrepeat\n    local result = redis.call('SCAN', cursor, 'MATCH', pattern, 'COUNT', 100)\n    cursor = result[1]\n    for _, key in ipairs(result[2]) do\n        table.insert(keys, key)\n    end\nuntil cursor == '0'\nreturn keys" 0
  ```