#!/bin/bash

# 打印确认
echo "Python path:  $ (which python3)"
python3 --version

# 设置环境变量
export PYTHONUNBUFFERED=1
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export PYTORCH_ENABLE_MPS_FALLBACK=1

# 禁用GPU/MPs加速
export CUDA_VISIBLE_DEVICES=""
export PYTORCH_MPS_DISABLE=1


# 加载环境变量
source ./set-env.sh

# Add this before starting the RQ worker
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
export MKL_DEBUG_CPU_TYPE=5 

# 创建日志目录
mkdir -p tmp/logs

python3 manage.py rqworker q_datasets q_trainings