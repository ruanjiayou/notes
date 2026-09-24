# 列表分页缓存

按《分页缓存方案.md》实现的列表分页缓存：**游标分页 + Redis ZSET 列表层 + meta 水位线**。

- Redis 客户端固定 **node-redis v4+**（`npm i redis`），通过 `setConfig({ redis })` 注入一次；
- 源库 `model` 由 **构造参数** 传入（契约见下，参考实现是 **Sequelize + MySQL**）；测试里用内存版 `MemoryModel` 模拟 `history` 表（无需起数据库）。

```
列表分页缓存/
├── config.js                模块级单例：redis 注入（setConfig / config.redis.instance）
├── 分页缓存方案.md          设计依据（游标 / 读路径 / meta / 反向索引的规范，与代码同步）
├── src/
│   ├── list-pagination.js   核心类 ListPagination + 错误码 + 游标解析（入口 paginate）
│   └── index.js             导出（ListPagination / decodeCursor / defaults / setConfig）
└── test/
    ├── helpers/            sequelize（MemoryModel）/ test-redis（真机）/ mock 数据 / 组装工具
    ├── key.test.js         key 组成、types→where、member 规则、缺省值、this.opts
    ├── decode.test.js      decodeCursor：格式 / t 的非法输入、e 可选（缺省不校验过期）
    ├── cursor.test.js      游标生成：t / m / o 的携带规则、o 累加、REV 方向、滑动续期
    ├── read-path.test.js   翻页、同分、回退分支、INV-1、参数边界
    ├── page-mode.test.js   页模式换算、深度限制、命令清单
    ├── cache-meta.test.js  meta、TTL 同生命周期、扩展续点、幂等、惰性重建、反向索引登记
    └── write-path.test.js  静态 publish：广播增删、幂等、过期组合剔除、多组合
```

> `config.js` 放在项目根、`list-pagination.js` 在 `src/` 下，所以后者 require 的是 `'../config.js'` ——
> 把 `src/list-pagination.js` + 根目录的 `config.js` 原样拷进业务工程即可，不用改一行路径。

## 快速开始

### 依赖注入（一次性）

`redis` 不在构造参数里，而是模块级单例，启动时注入一次：

```js
const { createClient } = require('redis');
const { setConfig } = require('./src');

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();
setConfig({ redis });
```

`src/` 本身依赖 node 内置模块、根目录的 `config.js`、以及 `sequelize`（只为拿 `Op` 拼 keyset 续点）。

### 例 1：省略全部可选参数

```js
const { ListPagination, decodeCursor } = require('./src');

const list = new ListPagination({
  model: historyModel,              // 源库模型（必填）
  key: 'user:v6:history:user:xxx',  // key 前缀（必填）
  where: { uid: 'xxx' },            // 业务过滤条件（必填）
});

// 读：唯一入口 paginate（无 cursor -> 第一页）
const page = await list.paginate({});
// -> { list: [{ id, type, member, score }], next: 'xxx' | null }

// 下一页：游标由中间件解析后传进来
const next = await list.paginate({ cursor: decodeCursor(req.query.cursor) });
```

省略后的默认值：`types='all'`、`rev=true`（倒序）、`fields=['modified_time','res_id','res_type']`、
`size=15`、`step=200`、`ttl=14400`（4 小时）、`where={}`、`now=Date.now`。

### 例 2：全部参数写明

```js
const list = new ListPagination({
  model: historyModel,                    // 源库模型
  key: 'user:v6:history:user:xxx',        // key 前缀（最终 key = 前缀 + ':' + 类型组合 + ':list'）
  where: { uid: 'xxx' },                  // 业务过滤条件
  types: ['article', 'ticker'],           // 'all' 或字符串数组；非 all 时并入 where.res_type
  rev: false,                             // 升序（默认 true 倒序）
  fields: ['modified_time', 'res_id', 'res_type'],  // [score 字段, id 字段, type 字段]
  size: 15,                               // 页大小缺省值
  step: 200,                              // 每次扩展向源库固定取多少条
  ttl: 4 * 3600,                          // 列表与 meta 的 TTL（秒，同值同批次）
  now: () => Date.now(),                  // 时钟注入（测试用）
});

// 读：游标模式
const page = await list.paginate({
  cursor: decodeCursor(req.query.cursor),  // 已解析的 { t, m?, o? }
  size: 20,
});
// -> { list: [{ id, type, member, score }], next: 'xxx' | null }

// 读：页模式（无 cursor 时生效）。page 从 1 开始，offset + size 不能超过 10000
const p3 = await list.page({ page: 3, size: 20 });
const jump = await list.paginate({ page: 3, size: 20 });   // 同上，走 paginate 入口

// 写：源库落库之后旁路更新缓存（静态方法，只需 key 前缀；member 恒为 id_type）
await ListPagination.publish(key, 'r999_article', score, 1);    // 新增
await ListPagination.publish(key, 'r999_article', score, -1);   // 删除
// -> { value, changed: ['all'], stale: [] }

await list.meta();   // -> { count, over } | null
```

`list` 的元素只返回 `{ id, type, member, score }`，记录详情由调用方按 id 自取。

> **构造参数全部收敛到 `this.opts`**（实例上只有这一个字段），缺省值与派生项都在同一对象上就地补齐：
>
> | 来源 | 字段 |
> | --- | --- |
> | 入参 | `model` `prefix`(key) `where` `types` `rev` `fields` `size` `step` `ttl` `now` |
> | 派生 | `fieldScore` `fieldId` `fieldType` `order` `combo` `keyList` `keyMeta` `keyIndex` |
>
> 传入的对象不会被改写（`where` 深一层拷贝）。

### 游标在类外解析

类**不做**游标解析，只接受解析好的对象，所以 `paginate({ cursor })` 收到字符串会直接 1402：

```js
const { decodeCursor } = require('./src');

app.get('/list', async (req, res) => {
  let cursor = null;
  if (req.query.cursor) cursor = decodeCursor(req.query.cursor);   // 1402 / 1403 在这里抛
  res.json(await list.paginate({ cursor, size: Number(req.query.size) || 15 }));
});
```

`decodeCursor(raw, now = Date.now())` -> `{ t: number, m: string|null, o: number }`：

| 情况                                             | 结果 |
| ------------------------------------------------ | ---- |
| 非字符串 / 载荷非 JSON / 非对象 / `t` 不是数字   | 1402 |
| 带了 `e` 但非数字，或 `e <= now`                 | 1403 |
| 不带 `e`                                         | 不校验过期（`e` 是可选字段） |

## key 与 member

```
key 前缀  = 缓存版本 + 场景 + 用户 id，如 `user:v6:history:user:xxx`
keyList   = 前缀 + ':' + 类型组合 + ':list'     类型组合：'all' 或 types 排序后 join('_')
keyMeta   = 前缀 + ':' + 类型组合 + ':meta'
keyIndex  = 前缀 + ':idx'                      反向索引 SET（同一前缀下所有组合共用，成员是组合名）
```

| types              | 组合名           | keyList                          | member         |
| ------------------ | ---------------- | -------------------------------- | -------------- |
| 缺省（`'all'`）    | `all`            | `…:all:list`                     | `r003_article` |
| `['ticker','article']` | `article_ticker` | `…:article_ticker:list`      | `r003_article` |
| `['article']`      | `article`        | `…:article:list`                 | `r003_article` |

- **member 恒为 `id_type`**，与类型组合无关 —— 同一前缀下所有组合共用同一套 member 字符串，
  `publish` 也就不必再猜某个组合的 member 长什么样；单类型组合里 type 后缀是常量，排序仍由 `id` 部分决定；
- `type` 只有几个字符、`id` 是 uuid(36)，member 从 36 变到 ~44 字节，对 ZSET 的内存与比较开销影响很小；
- `types` 非 `'all'` 时把 `where.res_type = types` 合并进查询条件（字段名固定是 `fields[2]`，没有额外配置项）；
- member 不做任何编码转换（uuid 原样）。两条 **id 约束**：
  1. **等长**（uuid / 定长 id）：等长时 member 的前 36 字符就是 `id`，ZSET 同分按 member 字节序排、
     源库按 `id` 字段序排才一致，翻页不重不漏；
  2. **不含下划线**：member 一律用 `member.split('_')` 解回 `[id, type]`（`_range()` 与 `publish` 同一套写法），
     id 里带 `_` 会把 id 截断；
- 一个 id 属于多个组合时，为每个组合建一个实例（**key 前缀相同**、`types` 不同），静态 `publish` 会一次广播到全部。

## fields 与排序

`fields` 固定三个，**按位置解构**（不是排序后 join）：`[fieldScore, fieldId, fieldType]`。

```js
const [fieldScore, fieldId, fieldType] = fields;   // 缺省 modified_time / res_id / res_type
order = [[fieldScore, rev ? 'DESC' : 'ASC'], [fieldId, rev ? 'DESC' : 'ASC']];   // 直接透传给 model
```

- score 字段是**时间**（MySQL `DATETIME`，取出来是 `Date`），ZSET 里存它的**毫秒数**：
  `_extend()` 里做两个方向的转换 —— 源记录 -> `new Date(v).getTime()`；续点回查源库时
  `new Date(s.score)` 转回 `Date`（时间列拿毫秒数去比会错）。除此之外没有映射层、不 `+1ms`、不做位移编码；
- `publish(key, value, score, ...)` 的 `score` 也按同一口径，**由调用方传毫秒数**（源头同样是 `new Date(...).getTime()`）；
- 同分靠 `fieldId` 收敛，所以 `order` 的第二键必须是 id。

## 读路径与结束判定

取数恒为 `n+1` 条：`items[0..n-1]` 交付，`items[n]` 是探察项（只用于判断有无下一页）。
游标 `base64url({ t, m?, o?, e? })`，`t = items[n].score`（探察项 —— 下一条待交付的那条的 score）：

```
首页             -> 全区间                    LIMIT 0 (n+1)
无 m 的游标      -> 闭区间从 t 读起            LIMIT 0 (n+1)
有 m 的游标      -> 同样闭区间 t，窗口放到 o+n+1  LIMIT 0 (o+n+1)
                    过滤：score != t 的全保留；score == t 时按 member 字节序
                          倒序保留 m <= cursor.m；升序保留 m >= cursor.m
```

- `m` / `o` **仅当 `probe.score === anchor.score`**（页边界落在同分 band 内）时携带：
  `m` 是探察项的 member，`o` 是该 band 内已交付成员累计数；
- **`t` 取探察项（`items[n]`）的 score，与闭区间配对使用**：`t` 就是「下一页第一条」的位置，
  闭区间一读正好从它开始，含它自己。已交付成员的 score 都 `> t`（否则它就与探察项同分、属于上一条），
  所以闭区间一条已交付的都带不回来 —— 不重不漏；
  > 反过来的写法（`t = anchor.score` + 开区间）也成立，两者选中同一批记录；
  > **但 `t` 与区间开闭必须配对**：`probe.score` 配开区间会丢掉探察项所在的整个同分块，
  > `anchor.score` 配闭区间会把该 band 里已交付的成员重新带回来。
- 过滤用 **member 比较**、不用 `o` 计数跳过：band 内已交付前缀有成员被删时计数会整体偏移而漏读；
- `o` 只用于**收敛窗口**；窗口读满且过滤后仍不足 `n+1` 时按 2 倍放大重读（上限 `MAX_SCORE_BAND = 800`），
  所以 `o` 被低估只会多读，不会漏；
- `e` = 签发时刻 + ttl（毫秒），**可选**：缺省不做过期校验，带了才校验（过期 -> 1403）。
  类签发时照常带 `e`，可选是给外部构造 / 长期保存的游标留的口子；
- **结束判定（INV-1）**：`next` 为空 ⟺「取不足 `n+1` 条」且「`meta.over === true`」。
  取不足且未 over -> 继续扩展；扩展推不动 -> 抛 1500，绝不静默截断；
- 页模式同样按 score 取数（`LIMIT offset (size+1)`），换算出的游标可直接接着走游标链路；
  它和 `cursor()` 一样**先读 `meta`，再在函数里判断**：没有缓存、或 `over !== true` 且
  `count < offset+size+1` 就反复 `_extend()`（首次即从源库把缓存建起来），直到覆盖到需要的深度，
  水位线推不动才停；`offset + size > 10000` 抛 1401。没有独立的 `_ensureDepth()`，逻辑就写在 `page()` 里。
- `page` 自身**不做**参数校验（按约定归中间件，中间件已保证是 ≥ 1 的整数），类内不再抛 1400；
  若中间件漏了，`page = 0` 会算出负 offset，真 Redis 直接报 `ERR offset is out of range`。

## 扩展与 meta

每次取数前先读 `meta` 判断：缓存没建立或覆盖不足就扩展 —— 从 **ZSET 尾部**续点固定取 `step` 条，
一次 Lua 原子写回 ZSET + meta，两个 key 同一个 TTL（4 小时），**无锁、不返回 1429**。

`meta = { count, over }`（就两个字段，一次 GET 拿到「有多少 + 到没到底」）：

| 字段    | 说明                                                     |
| ------- | -------------------------------------------------------- |
| `count` | 每次扩展由 `ZCARD` 重算（真值）                           |
| `over`  | 源库返回短页（不足 `step`）时置 `true`，表示已覆盖到底     |

续点不再落 meta：扩展时直接探针 ZSET 尾部
（倒序 `ZRANGE key 0 0 WITHSCORES`、升序 `ZREVRANGE key 0 0 WITHSCORES`），
`id` 由 member `split('_')` 拆出 —— 读的就是 ZSET 本身，不存在副本漂移。

扩展的 keyset 续点拼进 `where`（`Op` 来自 `require('sequelize')`）：

```js
// 倒序时。score 字段是时间列，必须 new Date(s.score) 转回去（直接比毫秒数 MySQL 会按字符串比而错位）
const at = new Date(s.score);
{ uid: 'u1',
  [Op.or]: [ { modified_time: { [Op.lt]: at } },
             { modified_time: at, res_id: { [Op.lte]: s.id } } ] }
```

每次 `_extend()` 都会把组合名幂等地 `SADD` 进反向索引（`keyIndex`）；反向索引只在这里登记、
在 `publish` 遇到「meta 不存在（缓存已过期）」时剔除。

> 续点是**闭区间**（同分用 `Op.lte` / `Op.gte`），所以每批都会重取边界那一条（`ZADD` 幂等，重复无害）。
> 因此 `step` 必须是 **≥ 2** 的整数：`step = 1` 时水位线永远推不动，会一路走到 1500。默认 200，正常不用改。

## 写入侧：静态 publish

新增 / 删除走旁路增量，**只传 key 前缀**，从反向索引取候选组合逐个处理；meta 存在**且组合含该记录类型**才受理：

```js
// score 传毫秒数（源记录的时间字段用 new Date(v).getTime() 取，与 _extend 同一口径）
await ListPagination.publish(key, 'r999_article', Date.now(), 1);    // ZADD + count+1
await ListPagination.publish(key, 'r999_article', Date.now(), -1);   // ZREM + count-1
```

| 情况                          | 行为                                                     |
| ----------------------------- | -------------------------------------------------------- |
| 受理且确实变更                 | 计数 ±1，组合名进 `changed`                              |
| 受理但无变更（ZADD/ZREM 未命中）| 只刷新 TTL，不进 `changed`                              |
| `meta` 不存在（缓存已过期）     | 不创建缓存，把组合从反向索引剔除，进 `stale`             |
| 删除后该组合 `count` 归零       | **不摘索引**：组合留在索引里，之后的新增才能 `ZADD` 回来（见下方说明） |
| 组合不含该记录类型              | 跳过（既不算 `changed`，也不算 `stale`，TTL 也不动）      |
| 反向索引为空（没有缓存）        | 什么都不做                                                |

- `value` 就是 ZSET member（恒为 `id_type`），后缀即记录类型，用它筛组合：`all` 通吃，
  否则要求组合名（`_` 分隔的类型列表）里含这个类型。比如 `r999_video` 只会落到 `all` 与 `video`，
  不会污染 `article_ticker`；

- `over` 不动，只改 `count`；列表与 meta 的 TTL 随写入续期；
- 同一个 member 重复写是幂等的（`ZADD` 返回值决定是否计数）；
- **删空不摘索引**（踩过的坑）：曾经在 `count` 归零时顺手 `SREM` 掉组合，结果组合从索引里消失 →
  之后的新增 `publish` 遍历索引找不到它 → 新记录进不了 `list`，而 `meta` 还是 `{count:0, over:true}`，
  读路径认为缓存已到底、不会扩展 → **列表一直空到 TTL 过期**。空组合留在索引里的代价只是一次空转的
  eval；删空时 `list` 这个 key 会被 Redis 删掉（空 ZSET 自动消失），下次 `ZADD` 会重新建起来；
- 新增记录不会「插队」到已翻过的页：它的 `score` 决定位置，按 score 区间翻页天然一致。

## model 契约

```js
model.findAll({ where, order, limit }) -> records[]
model.count({ where })                -> number
```

- `order`：**Sequelize 排序规格**，如 `[['modified_time','DESC'], ['res_id','DESC']]`（由类按 `fields`/`rev` 推出，原样透传）；
- `where`：查询条件。两点约定：
  1. **数组按「命中任一值」处理** → Sequelize 的 `{ res_type: ['article','ticker'] }` 即 `IN`；
  2. 扩展的 keyset 续点也拼在 `where` 里（`[Op.or]` + `Op.lt/Op.lte`，`Op` 由 `require('sequelize')` 引入），实现方按原样查询即可；
     **其中 score 字段给的是 `Date`**（源库列是时间类型），实现方不需要再转换；
- `limit`：取多少条（扩展恒为 `step`）。

一个最小的 Sequelize 实现（测试里 `test/helpers/sequelize.js` 的 `MemoryModel` 就是这套语义，只是数据在内存里）：

```js
const { Op } = require('sequelize');

findAll({ where, order, limit }) { return History.findAll({ where, order, limit, raw: true }); }
count({ where })                 { return History.count({ where }); }
```

> **MySQL 排序规则要小心**：同分靠 id 收敛，要求 `ORDER BY idField` 与 ZSET member 的字节序一致。
> id 列请用二进制 / 大小写敏感的 collation（如 `utf8mb4_bin`），否则大小写、重音字母的次序会和 Redis 不一致而错位。

## Redis 命令（node-redis 4.6）

| 用途                            | 调用                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| 按 score 区间取数（唯一读命令） | `sendCommand(['ZREVRANGEBYSCORE'\|'ZRANGEBYSCORE', keyList, 高/低, 低/高, 'LIMIT', String(offset), String(count), 'WITHSCORES'])` |
| 扩展 / 增量                     | `eval(script, { keys: [...], arguments: [...] })`（Lua 内 `ZADD` / `ZREM` / `ZCARD` / `GET` / `SET` / `EXPIRE`） |
| 反向索引                        | `sAdd` / `sRem` / `sMembers` / `expire`                                                    |
| meta 读取                       | `get`                                                                                      |

> **`sendCommand` 的参数必须全是字符串**：`LIMIT` 的 `offset` / `count` 一定要 `String(...)` 再放进去
> （分数同理），别把数字直接塞进数组。
>
> 读路径**只用 score 区间查询**，不使用 `ZRANK` / `ZREVRANK` / `ZRANGE`（按下标）——
> 混用会让同分 band 在不同页之间的遍历顺序不一致。
>
> **为什么直发命令、不用封装方法**（`redis@4.6.7` = `@redis/client@1.5.8`，实测生成的命令）：
>
> | 写法 | 实际发出 | 结果 |
> | --- | --- | --- |
> | `zRangeByScore(k, a, b, {WITHSCORES:true, REV, LIMIT})` | `ZRANGEBYSCORE k a b LIMIT …` | ❌ `WITHSCORES` / `REV` 被静默丢弃（`transformArguments` 只认 `LIMIT`）→ 没 score、永远升序 |
> | `zRangeByScoreWithScores(k, a, b, {REV, LIMIT})` | `ZRANGEBYSCORE k a b LIMIT … WITHSCORES` | ⚠️ 有 score，`REV` 仍被丢弃 |
> | `zRevRangeByScore` | —— | ❌ v4.6 未提供该封装 |
> | `zRangeWithScores(k, a, b, {BY:'SCORE', REV, LIMIT})` | `ZRANGE k a b BYSCORE REV LIMIT … WITHSCORES` | ✅ 但要求 **Redis ≥ 6.2** |
> | **`sendCommand(['Z[REV]RANGEBYSCORE', …])`（本实现）** | `ZREVRANGEBYSCORE k b a LIMIT … WITHSCORES` | ✅ 原生 `WITHSCORES` + 原生倒序，**Redis 1.0.5 起即有** |
>
> 代价是回复为扁平数组 `['r001_article', '1700000000000', …]` 且 score 是字符串，
> `_range()` 里自行配对并转数字（每个测试都覆盖这条路径）。

## 错误码（`defaults.ERRORS`）

| code | 含义                                                                     |
| ---- | ------------------------------------------------------------------------ |
| 1400 | 留给**中间件**的参数错误码（本类已不抛：`page` 的合法性校验在类外）        |
| 1401 | 翻页深度超限（`offset + size > 10000`），请改用游标                       |
| 1402 | 游标非法（含「把未解析的字符串直接传给 paginate」）                       |
| 1403 | 游标已过期（仅当游标带了 `e`）                                             |
| 1500 | 取不足 `n+1` 且 `over !== true`（水位线停滞），或记录缺少 score 字段      |

## 可调默认值（`defaults`）

| 常量              | 值       | 说明                                   |
| ----------------- | -------- | -------------------------------------- |
| `PAGE_SIZE`       | 15       | 页大小缺省值                            |
| `STEP_SIZE`       | 200      | 每次扩展向源库取的条数（必须 ≥ 2，续点是闭区间） |
| `TTL_SEC`         | 14400    | 列表 / meta / 反向索引的存活时间（4 小时） |
| `MAX_SCORE_BAND`  | 800      | 同分 band 回读窗口上限（防伪游标放大）   |
| `MAX_PAGE_DEPTH`  | 10000    | 页模式深度上限（`offset + size` 上限）   |

## 测试

```bash
npm test           # = node --test test/*.test.js
```

> 单测跑在**测试环境的真实 Redis** 上（`TEST_REDIS_URL` 可改，缺省 `redis://10.0.15.240:6379`）：
> `test/helpers/test-redis.js` 只是客户端包装 —— 转发命令、记流水（`commands` / `calls` / `probes`）、
> 并且把所有 key 收在本进程的 `lp:t:<pid>:...` 命名空间下，`after` 钩子统一清掉。
> 源库仍用 `test/helpers/sequelize.js` 的内存版 `MemoryModel`，所以**不需要数据库**。

> 唯一慢的地方是 `require('sequelize')` 本身要拉 700+ 个模块（本机 ~20s，与用例无关）；
> 只想要 `Op` 符号的话，`require('sequelize/lib/operators')` 约 90ms 且拿到的是**同一个** `Op` 对象
> —— 但那是内部路径，业务代码里仍按常规写 `require('sequelize')`。
> 真 Redis 下每个用例都要走网络，全量 64 项约 6 分钟（并行跑 7 个文件）；单跑一个文件是秒级。

64 项测试跑在**内存源库（`history` 语义）+ 真实 Redis** 上，覆盖：
250 条重度同分 17 页全覆盖与顺序、翻页中改 `size`、极端同分（30 条同 score）、band 长于 `size`、
升序列表（含升序 + 长 band 的 m 过滤、全程不带 REV）、空列表 / 单条 / `size=1`、
回退分支（无 m 越区间、`m` 被删、`o` 被低估放大窗口）、水位线停滞 1500、
游标 13 种非法输入（decodeCursor）与滑动续期、`t` 必须为数字、`m`/`o` 只在同分时携带、`o` 跨页累加与越 band 重算、
meta（`count` / `over`）与 TTL 同值同批次、keyset 续点形状、
**score 字段是时间（`Date`）时的双向转换**（进 ZSET 转毫秒、续点回查转回 `Date`）、
取满不置 over、短页才置 over、
无锁并发首页幂等、惰性重建、缓存被删后重建继续翻页、反向索引登记、
静态 `publish`（广播多组合、按类型筛组合、幂等、无变更不算 changed、过期组合剔除、TTL 续期、索引为空时不动）、
key 组成、types→where、member 规则（恒为 `id_type`）、缺省值与 `this.opts` 收敛、页模式换算与 1401、
取数只发 `ZRANGEBYSCORE` / `ZREVRANGEBYSCORE`（含 `REV` 与 `LIMIT` 参数形状）。

另做过 60 个随机场景压测（随机数据量 / 同分粒度 / `size` / 方向 / types + 翻页中并发删除），零失败。
