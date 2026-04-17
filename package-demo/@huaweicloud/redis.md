# redis 云控制台

EVAL '
local prefix = ARGV[1];
local count = 100;

local cursor = "0";
local total_deleted = 0;

repeat
    local result = redis.call("SCAN", cursor, "MATCH", prefix .. "*", "COUNT", count);
    cursor = result[1];
    local keys = result[2];

    for i=1,#keys do
        -- 每次删除单个 key，避免跨 slot
        total_deleted = total_deleted + redis.call("DEL", keys[i]);
    end;
until cursor == "0"

return total_deleted;' 0 "user:history"

EVAL 'local prefix=ARGV[1]; local count=100; local cursor="0"; local total_deleted=0; repeat local result=redis.call("SCAN", cursor, "MATCH", prefix.."*", "COUNT", count); cursor=result[1]; local keys=result[2]; for i=1,#keys do total_deleted=total_deleted+redis.call("DEL", keys[i]); end; until cursor=="0"; return total_deleted;' 0 "user:history"
EVAL 'local prefix=ARGV[1]; local count=100; local cursor="0"; local total_deleted=0; repeat local result=redis.call("SCAN", cursor, "MATCH", prefix.."*", "COUNT", count); cursor=result[1]; local keys=result[2]; for i=1,#keys do total_deleted=total_deleted+redis.call("DEL", keys[i]); end; until cursor=="0"; return total_deleted;' 0 "user:favors"
删除了 3687 个 history
删除了 708188 个 favors