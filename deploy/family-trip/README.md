# 两家 6 人、4 天 3 晚部署指南

这个目录提供 Mac mini + Docker + Cloudflare Tunnel 的生产配置。应用只监听 `127.0.0.1:3030`，公网只能通过 HTTPS 隧道访问。

## 1. 保存本机密钥

推荐把独立的 32 字节加密密钥和初始管理员密码存入 macOS 钥匙串，`manage.sh` 会在启动时读取，不会把密钥写进 Git 仓库。`.env.example` 仅供非 macOS 主机参考。

## 2. 构建与启动

```bash
./manage.sh build
./manage.sh up -d
./manage.sh ps
```

本机健康检查：

```bash
curl -fsS http://127.0.0.1:3030/api/health
```

## 3. 配置 HTTPS 隧道

首次执行 `cloudflared tunnel login`，在浏览器中授权 `xinyi.dev`。然后创建命名隧道并绑定域名：

```bash
cloudflared tunnel create trek-family
cloudflared tunnel route dns trek-family trek.xinyi.dev
```

以 `cloudflared.yml.example` 为模板创建 `~/.cloudflared/config.yml`，再运行：

```bash
cloudflared tunnel run trek-family
```

本地网络若阻断 QUIC/UDP 7844，请像示例一样固定为 `protocol: http2`。确认访问正常后，再将 `cloudflared tunnel --config ~/.cloudflared/config.yml run trek-family` 注册为当前用户的登录自启动服务；不能直接使用不带 `tunnel run` 参数的默认 Homebrew 服务。

## 4. 首次安全设置

1. 登录 `https://trek.xinyi.dev` 并立即修改管理员密码。
2. 在管理员设置中关闭开放注册。
3. 管理员开启 MFA；如所有成人都愿意，可再要求全员 MFA。
4. 创建本次 4 天 3 晚行程。
5. 创建最多使用 3 次、7 天过期、自动加入该行程的注册链接，发给另外 3 位成人；注册完成后删除链接。
6. 将两位儿童添加为行程访客。
7. 开启每日自动备份并保留至少 14 天；另存一份异机备份。

## 5. 行程结构建议

- “交通”中建立家庭 A、家庭 B 两条独立抵达/返程记录。
- 第 1 天安排汇合与入住，避免两地出发延误导致首日计划过满。
- 第 2、3 天安排完整当地游览。
- 第 4 天安排退房、弹性活动和两家各自返程。
- 预算中录入 6 位成员/访客，并按实际项目选择按人、按家庭或自定义分摊。
- 行李清单分成“家庭 A”“家庭 B”“儿童共用”“公共物品”四类，明确负责人。

## 6. 更新与回滚

更新前先在后台创建手动备份，并导出或另存钥匙串中的 `TREK Family Encryption Key`。镜像更新失败时，保留 `data/` 与 `uploads/`，切回上一个 Git 提交重新构建即可；不要把卷挂载到 `/app`。
