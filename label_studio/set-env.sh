#!/bin/bash
# 环境变量配置文件

export __MINIO_STORAGE_ENDPOINT=http://8.153.173.61
export DEBUG=true
export DJANGO_DB=sqlite
export DJANGO_SETTINGS_MODULE=core.settings.label_studio
export LABEL_STUDIO_MINIO_ADDRESS=http://8.153.173.61
export LOG_DIR=tmp
export LOG_LEVEL=DEBUG
export MINIO_STORAGE_ACCESS_KEY=DzdIdnRJgfCmZoIeVqe7
export MINIO_STORAGE_BUCKET_NAME=yolo
# export MINIO_STORAGE_ENDPOINT=http://8.153.173.61
export MINIO_STORAGE_SECRET_KEY=quscuWabOsipLpwueRb8CwpAFes2tdq0tcylGa45
export POSTGRE_HOST=
export PYTHONUNBUFFERED=1
export LABEL_STUDIO_HOST=http://localhost:8010
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_DB=0
export RQ_TASK_TIMEOUT=1800

echo "环境变量已设置"
