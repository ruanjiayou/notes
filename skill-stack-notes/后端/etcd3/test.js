const { Etcd3 } = require('etcd3');
const _ = require('lodash');

const config = {};

// 1. 初始化 etcd3 客户端
const client = new Etcd3({
  // 如果在 Docker 容器内运行，填 'http://etcd-server:2379'
  // 如果在宿主机本地直接运行测试，填 'http://127.0.0.1:2379'
  hosts: 'http://127.0.0.1:2379',
  // 核心：配置账号密码认证
  // auth: {
  //   username: 'root',
  //   password: '' // 替换为你设置的 root 密码
  // }
})
async function getV(prefix) {
  const o = await client.getAll().prefix(prefix).strings();
  Object.keys(o).forEach(key => {
    try {
      const info = JSON.parse(o[key]);
      let v = undefined;
      switch (info.type) {
        case 'string': v = info.value; break;
        case 'bool': v = !!info.value; break;
        case 'number': v = info.value; break;
        case 'json': v = info.value; break;
      }
      const k = key.replace(prefix + '/', '').trim().replace(/\//g, '.')
      _.set(config, k, v);
    } catch (e) {

    }
  })
}

async function main() {
  try {
    console.log('正在连接 etcd...');

    // 2. 首次获取配置 (Get)
    await getV('global');
    await getV('downloader-server');
    console.log(`[初始配置] 当前的值为:`, config || '空(未设置)');

    // 3. 开启实时监听 (Watch)
    console.log(`[监听启动] 开始实时监听 的变更...`);

    const watcher = await client.watch().prefix('downloader-server').create();

    // 监听数据改变或新增 (Put 事件)
    watcher.on('put', (res) => {
      console.log(`\n🚀 [配置变更通知] 检测到键值被修改或创建！`);
      console.log(`键: ${res.key.toString()}`);
      console.log(`新值: `, res.value.toJSON());

      // 在这里触发你业务系统的热更新逻辑，比如：
      // myDatabase.reconnect(res.value.toString());
    });

    // 监听数据被删除 (Delete 事件)
    watcher.on('delete', (res) => {
      console.log(`\n⚠️ [配置删除通知] 检测到键值被删除了！`);
      console.log(`键: ${res.key.toString()}`);
    });

    // 监听连接错误（防掉线重连）
    watcher.on('error', (err) => {
      console.error('Watcher 发生错误:', err);
    });

  } catch (error) {
    console.error('连接或操作 etcd 失败:', error);
  }
}

main();

// 保持进程不退出
process.on('SIGINT', async () => {
  console.log('正在关闭 etcd 客户端...');
  client.close();
  process.exit(0);
});