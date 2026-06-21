# PAT 生产环境配置

PAT = 生产环境（Production Acceptance Test）。本目录归档 label_studio（ai-platform）
和 ml_backend 的生产配置文件，纳入 git 版本追踪，便于版本回溯与介质分发。

## 目录结构

```
deploy/pat/
├── ai-platform/
│   ├── docker-compose.yml   # ai-platform 容器编排（app/rq/nginx/db/redis/minio）
│   └── .env.example         # 生产环境变量模板（密钥已脱敏，部署时 cp 后填真实值）
└── ml-backend/
    ├── docker-compose.yml   # ml-backend 容器编排（ship-segment-backend）
    └── .env                 # ml-backend 环境变量（LABEL_STUDIO_API_KEY 留空待填）
```

## 与外部 deploy/ 的关系

外部 `/Users/xupengbing/Documents/label_studio/deploy/{ai-platform,ml-backend}/`
是部署介质的工作目录（不在 git 仓库内）。本目录是其 git 内归档副本，内容应保持一致。
修改配置时，两边同步更新。

## 部署使用方法

### ai-platform

```bash
# 1. 复制模板到部署目录
cp deploy/pat/ai-platform/.env.example /opt/ai-platform/.env

# 2. 编辑填入真实密钥（<生产密码>、<生产AccessKey>、<生产SecretKey>）
vi /opt/ai-platform/.env

# 3. 复制 docker-compose.yml
cp deploy/pat/ai-platform/docker-compose.yml /opt/ai-platform/docker-compose.yml

# 4. 启动
cd /opt/ai-platform && docker compose up -d
```

### ml-backend

```bash
# 1. 复制配置到部署目录
cp deploy/pat/ml-backend/.env /opt/ml_backend/.env
cp deploy/pat/ml-backend/docker-compose.yml /opt/ml_backend/docker-compose.yml

# 2. 填入 LABEL_STUDIO_API_KEY（必须使用【旧版令牌 / Legacy Token】）
#    ⚠ 不能用个人令牌(JWT)，否则预标注下载图片报 401
#    获取方法：浏览器登录 LS → 右上角账户设置 →「旧版令牌」复制其值
#    详见 deploy/TROUBLESHOOTING.md 问题 10
vi /opt/ml_backend/.env

# 3. 启动
cd /opt/ml_backend && docker compose up -d
```

## 关键配置说明

| 配置项 | 文件 | 说明 | 对应问题 |
|---|---|---|---|
| `ML_BACKEND_URL` | ai-platform/.env | Django 自动创建 ML Backend 用的 URL，必须用宿主机 IP | 问题 11 |
| `LABEL_STUDIO_API_KEY` | ml-backend/.env | ml-backend 回连 LS 下载图片的鉴权令牌，须用旧版令牌 | 问题 10 |
| `user: "1000:0"` | ml-backend/docker-compose.yml | 与 ai-platform 容器 UID 一致，避免共享卷属主冲突 | 问题 6 |
| `HOME=/tmp` | ml-backend/docker-compose.yml | UID 1000 无家目录，给 appdirs 可写 HOME | 问题 9 |

## 修改配置时的注意事项

1. 修改本目录文件后，同步更新外部 `deploy/` 工作目录
2. ai-platform/.env.example 含真实密钥时，必须先脱敏再提交
3. ml-backend/.env 的 LABEL_STUDIO_API_KEY 必须保持留空，部署时手动填入
4. 详细排障指引见 `deploy/TROUBLESHOOTING.md`
