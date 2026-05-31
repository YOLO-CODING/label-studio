#!/bin/bash

# 加载环境变量
source ./set-env.sh

# 创建日志目录
mkdir -p tmp/logs

# 使用 poetry 环境运行 Django
poetry run python manage.py runserver