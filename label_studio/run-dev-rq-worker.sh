#!/bin/bash

# 打印确认
echo "Python path: $(which python3)"
python3 --version

# 设置环境变量
export PYTHONUNBUFFERED=1
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export PYTORCH_ENABLE_MPS_FALLBACK=1

# 禁用GPU/MPs加速（允许通过环境变量覆盖，生产环境可设置 CUDA_VISIBLE_DEVICES=0 使用 GPU）
export CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:-}"
export PYTORCH_MPS_DISABLE=1


# 加载环境变量
source ./set-env.sh

# Add this before starting the RQ worker
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
export MKL_DEBUG_CPU_TYPE=5 

# 创建日志目录
mkdir -p tmp/logs

poetry run python manage.py rqworker q_datasets q_trainings