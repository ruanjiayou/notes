# 权限控制

## 逻辑

- 跳转from->to
- 没token? 是白名单就next; 不是就跳到/login?redirect=${to.path}
- 有token? /login转到/; 首次要加载user_info; 根据权限生成路由表; 权限不够就跳到401