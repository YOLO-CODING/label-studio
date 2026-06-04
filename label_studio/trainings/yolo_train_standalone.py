#!/usr/bin/env python
"""
Standalone YOLO training script.
Run this as a subprocess to avoid macOS fork segfault with PyTorch.
"""
import os
import sys

# Add the label_studio directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.dirname(script_dir)
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

# Set environment variables BEFORE any imports
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.label_studio")
os.environ.setdefault("DJANGO_DB", "sqlite")
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["PYTORCH_MPS_DISABLE"] = "1"
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

import django
django.setup()

import json
import logging
from trainings.managers import YoloTrainingManager
from plans.models import Plan

def main():
    if len(sys.argv) < 5:
        print("Usage: yolo_train_standalone.py <plan_id> <label_type> <working_dir> <dataset_entry> [epoch_count] [last_weight]")
        sys.exit(1)
    
    plan_id = int(sys.argv[1])
    label_type = sys.argv[2]
    working_dir = sys.argv[3]
    dataset_entry = sys.argv[4]
    epoch_count = int(sys.argv[5]) if len(sys.argv) > 5 else 10
    last_weight = sys.argv[6] if len(sys.argv) > 6 and sys.argv[6] != "None" else None
    epoch_start = int(sys.argv[7]) if len(sys.argv) > 7 else 0
    
    print(f"Starting YOLO training: plan={plan_id}, label={label_type}, epochs={epoch_count}, epoch_start={epoch_start}")
    print(f"Working dir: {working_dir}")
    print(f"Dataset: {dataset_entry}")
    print(f"Last weight: {last_weight}")
    
    plan = Plan.objects.get(pk=plan_id)
    m = YoloTrainingManager(
        label_type=label_type,
        working_dir=working_dir,
        dataset_entry=dataset_entry,
        last_weight=last_weight,
        imgsz=plan.imgsz,
        plan=plan
    )
    
    if last_weight is None:
        print("Running first epoch training...")
        m.do_training_first(epoch_count)
    else:
        print(f"Continuing training from: {last_weight}, epoch_start={epoch_start}")
        m.do_training_epoch(epoch_start, epoch_count)
    
    if m.is_failed():
        print(f"Training failed: {m.get_fail_message()}", file=sys.stderr)
        sys.exit(1)
    else:
        # Save best weight path to a temp file
        weight_file = os.path.join(working_dir, ".best_weight.txt")
        best_weight = m.get_best_weight()
        with open(weight_file, "w") as f:
            f.write(str(best_weight) if best_weight else "")
        print(f"Training completed. Best weight: {best_weight}")
        
        # Verify epoch data was saved
        from plans.models import TrainingEpochs
        epoch_count_db = TrainingEpochs.objects.filter(plan=plan).count()
        print(f"TrainingEpochs saved: {epoch_count_db}")
        
        sys.exit(0)

if __name__ == "__main__":
    main()
