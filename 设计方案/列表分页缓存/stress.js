'use strict';

/* 临时压测脚本（不进 node --test 的匹配范围），跑在测试环境的真实 Redis 上：
 *   ① 随机配置下 member 恒为 id_type 的翻页一致性
 *   ② publish 的类型筛选：只应落到组合名含该类型的组合上，且列表里不能出现不属于该组合的类型
 * 注：step 取 >= 2 —— 续点是闭区间，每次会重取边界那条，step=1 水位线推不动（见 README）。
 */
const { ListPagination, setConfig } = require('./src');
const { MemoryModel } = require('./test/helpers/sequelize');
const { getRedis, NS } = require('./test/helpers/test-redis');
const { buildRows, drain, expected } = require('./test/helpers/data');

const POOL = ['video', 'article', 'ticker', 'note'];
const FIELDS = ['modified_time', 'res_id', 'res_type'];
const KEY = `${NS}:stress:k`;                 // 本进程独占前缀，跑完统一清理
const rnd = (n) => Math.floor(Math.random() * n);
const j = (x) => JSON.stringify(x);
const comboOf = (ts) => (ts === 'all' ? 'all' : [].concat(ts).slice().sort().join('_'));

async function main() {
  const redis = await getRedis();
  let bad = 0;
  for (let s = 0; s < 30; s++) {
    await redis.wipe(KEY);                   // 每个场景都从空缓存开始
    const count = 5 + rnd(120);
    const group = 1 + rnd(6);
    const pool = POOL.slice(0, 2 + rnd(3));
    const rows = buildRows({ count, group, types: pool });
    const size = 1 + rnd(8);
    const step = 2 + rnd(20);
    const rev = rnd(2) === 0;
    const kind = ['all', 'single', 'multi'][rnd(3)];
    const types = kind === 'all' ? 'all'
      : kind === 'single' ? [pool[rnd(pool.length)]]
        : pool.slice().sort(() => rnd(3) - 1).slice(0, 2);

    const model = new MemoryModel(rows);
    setConfig({ redis });
    const mk = (t) => new ListPagination({ model, key: KEY, where: { uid: 'u1' }, types: t, rev, fields: FIELDS, size, step });

    const tag = j({ count, group, size, step, rev, types, kind });

    // ① 全量翻页
    const r = await drain(mk(types), { size });
    const exp = expected(rows.filter((x) => types === 'all' || types.includes(x.res_type)), { rev });
    if (j(r.unique) !== j(exp) || r.ids.length !== r.unique.length) {
      bad++; console.log('MISMATCH', tag, j({ got: r.unique.length, exp: exp.length }));
      continue;
    }

    // ② 把本场景组合 + 几个固定组合都建起来
    const used = [types, 'all', ['article', 'ticker'], ['video'], ['note']];
    for (const t of used) await mk(t).paginate({ size });
    const usedCombos = [...new Set(used.map(comboOf))];
    const registered = (await redis.sMembers(KEY + ':idx')).slice().sort();
    if (j(registered) !== j(usedCombos.slice().sort())) { bad++; console.log('INDEX MISMATCH', tag, j({ registered, usedCombos })); continue; }

    const t = POOL[rnd(POOL.length)];
    const member = 'r' + (1000 + rnd(9000)) + '_' + t;
    const pr = await ListPagination.publish(KEY, member, 1800000000000, 1);
    const want = usedCombos.filter((c) => c === 'all' || c.split('_').includes(t)).sort();
    if (j(pr.changed.slice().sort()) !== j(want)) { bad++; console.log('PUBLISH MISMATCH', tag, j({ t, got: pr.changed, want })); }

    // ③ 每个列表里不能出现不属于该组合的类型
    for (const c of registered) {
      const z = await redis.entries(KEY + ':' + c + ':list');
      const leak = z.map((x) => String(x.value)).filter((m) => c !== 'all' && !c.split('_').includes(m.split('_')[1]));
      if (leak.length) { bad++; console.log('LEAK', tag, j({ combo: c, leak: leak.slice(0, 3) })); }
    }
  }
  await redis.wipe(NS);
  await redis.c.quit();
  console.log(bad === 0 ? 'STRESS OK (30 scenarios)' : 'STRESS FAIL ' + bad);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
