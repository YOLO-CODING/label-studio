# 本地测试启动指南（macOS Apple M5）

> 本文档放置在项目根目录下。所有命令通过自动定位项目路径执行，无需手动修改。

## 前置条件

- Poetry、Node.js 24+、Yarn 1.22、Docker Desktop
- Docker 容器已启动（项目外部）：
  - Redis（端口 `16379`）
  - MinIO（端口 `9000`，账号 `minioadmin/minioadmin`）

---

## 零、设置项目路径（必做，每个新终端）

**进入项目根目录后执行：**

```bash
cd /path/to/where/this/file/is   # cd 到本文档所在目录
export LS_HOME="$(pwd)"
```

之后所有命令使用 `$LS_HOME` 自动定位，无需手动修改路径。

---

## 一、首次准备（仅一次）

```bash
# 1. 后端依赖
cd $LS_HOME
poetry install

# 2. 前端依赖（国内镜像 + 跳过 Cypress）
cd $LS_HOME/web
yarn config set registry https://registry.npmmirror.com
CYPRESS_INSTALL_BINARY=0 yarn install --frozen-lockfile

# 3. 数据库迁移
cd $LS_HOME
make migrate-dev
# ← 若提示 training_config 已存在，则：
# poetry run python label_studio/manage.py migrate plans 0004 --fake

# 4. 静态文件
cd $LS_HOME
DJANGO_DB=sqlite LOG_DIR=tmp DEBUG=true LOG_LEVEL=DEBUG \
DJANGO_SETTINGS_MODULE=core.settings.label_studio \
poetry run python label_studio/manage.py collectstatic --noinput
```

---

## 二、环境变量

`label_studio/set-env.sh` 已配置：

| 变量 | 值 | 说明 |
|------|-----|------|
| DJANGO_DB | sqlite | 开发用 SQLite |
| REDIS_HOST | localhost | 本地 Redis |
| REDIS_PORT | 16379 | 本地 Redis 端口 |
| MINIO_STORAGE_ENDPOINT | localhost:9000 | 本地 MinIO |
| LABEL_STUDIO_HOST | localhost:8010 | 前端地址 |
| YOLO_TRAIN_DEVICE | cpu | CPU 训练 |

---

## 三、启动（3 个 screen 会话）

```bash
### Django 后端
screen -dmS django bash -c "cd $LS_HOME && make run-dev 2>&1 | tee /tmp/ls-django.log"

### 前端 HMR
screen -dmS frontend bash -c "cd $LS_HOME/web && npx nx run labelstudio:serve:development 2>&1 | tee /tmp/ls-frontend.log"

### RQ Worker（YOLO 训练）
screen -dmS rqworker bash -c "cd $LS_HOME/label_studio && bash run-dev-rq-worker.sh 2>&1 | tee /tmp/ls-rq.log"
```

等待约 30 秒后访问 **http://localhost:8010**。

> **注意：** screen 命令使用双引号 `"..."`，让 `$LS_HOME` 在父 shell 中展开为绝对路径，避免会话内变量丢失。

---

## 四、日常维护

```bash
# 查看 screen 会话
screen -ls

# 查看日志
tail -f /tmp/ls-django.log
tail -f /tmp/ls-frontend.log
tail -f /tmp/ls-rq.log

# 进入 screen 交互（Ctrl+A D 退出不停止）
screen -r django
screen -r rqworker
```

---

## 五、停止

```bash
screen -S django -X quit
screen -S frontend -X quit
screen -S rqworker -X quit

# 兜底杀进程
pkill -f "manage.py runserver"
pkill -f "labelstudio:serve"
pkill -f "rqworker"
pkill -f "nx.*daemon"
pkill -f "yolo_train_standalone"
```

---

## 六、训练任务排错速查

| 现象 | 检查方法 |
|------|----------|
| 训练立即失败 | `tail -100 /tmp/ls-rq.log` 看 trace |
| 卡在 RUNNING | `ps aux \| grep yolo_train_standalone` 确认是否在跑 |
| 图表无数据 | 数据库 `SELECT * FROM plan_training_epochs` 是否空 |
| Redis 连不上 | `docker ps --filter name=redis` 检查端口映射 |
| MinIO 401 | `set-env.sh` 中账号密码是否正确 |
