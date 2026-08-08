# 管理员 Token 登录调试

- Session ID: `admin-token-login`
- Status: [OPEN]
- Symptom: 管理员登录后页面闪退，疑似 Token 选择或鉴权失败。

## 假设

1. `/auth/me` 虽显式携带新管理员 Token，但请求拦截器读取或覆盖了它。
2. 登录成功后进入 `/admin`，平台请求没有携带刚保存的管理员 Token。
3. 管理员 Token 有效，但后端 `/auth/me` 返回的平台角色或权限为空。
4. 后续平台接口返回 401，响应拦截器清除管理员会话并跳回登录页。

## 证据点

- 管理员登录请求开始及响应 Token 摘要。
- `/auth/me` 实际请求 Token 摘要及返回角色、权限数量。
- 管理员会话保存后的 Token 摘要。
- `/platform/**` 请求所选 Token 来源。
- 401 响应的 URL、错误码与被清理的会话类型。

## 进度

等待插桩后复现。
