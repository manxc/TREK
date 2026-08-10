# 两家 6 人、4 天 3 晚部署指南

这个目录提供 Mac mini + OrbStack Docker + Cloudflare Tunnel 的生产配置。应用只监听 `127.0.0.1:3030`，公网只能通过 HTTPS 隧道访问。主域名为 `trek.jiqiao.ai`，迁移期保留 `trek.xinyi.dev`。

## 1. 保存本机密钥

推荐把独立的 32 字节加密密钥和初始管理员密码存入 macOS 钥匙串，`manage.sh` 会在启动时读取，不会把密钥写进 Git 仓库。`.env.example` 仅供非 macOS 主机参考。

## 2. 构建与启动

```bash
./manage.sh build
./manage.sh up -d
./manage.sh ps
```

运行数据保存在 OrbStack 命名卷 `trek-family-data` 与 `trek-family-uploads`，不会写入源码目录。

本机健康检查：

```bash
curl -fsS http://127.0.0.1:3030/api/health
```

## 3. 配置 HTTPS 隧道

首次执行 `cloudflared tunnel login`，在浏览器中授权域名。然后创建命名隧道并绑定两个域名：

```bash
cloudflared tunnel create trek-family
cloudflared tunnel route dns trek-family trek.xinyi.dev
cloudflared tunnel route dns trek-family trek.jiqiao.ai
```

`manage.sh` 会从 `~/.cloudflared/config.yml` 读取隧道编号和凭据路径，随后由 Compose 中的 `cloudflared` 容器连接到 `app:3000`。凭据以只读 secret 挂载，不写入镜像或 Git。

```bash
./manage.sh up -d
```

容器固定使用 HTTP/2，避免本地网络阻断 QUIC/UDP 7844。不要再注册 macOS `cloudflared` 登录启动项，以免同一台机器重复运行两个副本。

## 4. 首次安全设置

1. 登录 `https://trek.jiqiao.ai` 并立即修改管理员密码。
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

更新前先在后台创建手动备份，并导出或另存钥匙串中的 `TREK Family Encryption Key`。另做一份经过校验的外部备份：

```bash
./manage.sh external-backup
```

默认备份到 `/Users/manxc/Backups/TREK/<UTC 时间>/`，其中包含压缩包和 SHA-256 校验文件。镜像更新失败时，切回上一个 Git 提交重新构建，再把备份恢复到两个命名卷；不要把卷挂载到 `/app` 根目录。
