# etcd

## 部署
- docker compose up
- 访问 `http://localhost:8002/index.html`
- 测试连接: Host etcd-server, port 2379

## 开启鉴权
- 执行命令(distroless无法进入容器)
  - 创建用户: `docker exec -it etcd-server etcdctl user add root --new-user-password=你的密码`
  - 绑定用户角色: `docker exec -it etcd-server etcdctl user grant-role root root`
  - 激活鉴权: `docker exec -it etcd-server etcdctl auth enable`