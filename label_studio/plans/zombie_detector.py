"""
Zombie Training Task Detector

This module implements a 3-layer detection strategy for identifying zombie training tasks:

Layer 1: Heartbeat Detection (30 min timeout)
    - Detects processes that are paused or stuck (e.g., laptop lid closed)
    - Identifies "fake alive" scenarios where process exists but isn't working

Layer 2: Process Detection (PID check)
    - Detects processes that have been terminated (kill, crash, OOM)
    - Identifies "real dead" scenarios where process no longer exists

Layer 3: Time-based Fallback (24 hour timeout)
    - Catches edge cases not covered by other layers
    - Prevents zombie tasks from persisting indefinitely
"""
import logging
import os
import errno
from datetime import timedelta

from django.utils.timezone import now
from plans.models import Plan

logger = logging.getLogger(__name__)


class ZombieDetector:
    """Detect and clean up zombie training tasks"""
    
    HEARTBEAT_TIMEOUT = timedelta(minutes=30)
    MAX_RUNNING_TIME = timedelta(hours=24)
    
    @staticmethod
    def is_process_alive(pid):
        """
        Check if a process with given PID exists.
        
        Returns:
            bool: True if process exists, False otherwise
        """
        if not pid:
            return False
        
        try:
            os.kill(pid, 0)
            return True
        except OSError as e:
            if e.errno == errno.ESRCH:
                return False
            elif e.errno == errno.EPERM:
                return True
            else:
                logger.error(f"Error checking process {pid}: {e}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error checking process {pid}: {e}")
            return False
    
    @staticmethod
    def mark_plan_as_failed(plan, reason):
        """
        Mark a plan as failed with reason.
        
        Args:
            plan: Plan instance to mark
            reason: str reason for failure
        """
        plan.status = Plan.STATUS_FAILED
        plan.failed = True
        plan.fail_message = f"僵尸任务检测: {reason}"
        plan.save()
        
        logger.info(f"Plan {plan.id} marked as failed: {reason}")
    
    def detect_and_clean_zombies(self):
        """
        Main entry point for zombie detection.
        
        Scans all Running status plans and identifies zombie tasks using
        3-layer detection strategy.
        
        Returns:
            dict: Summary of detection results
                - heartbeat_timeout: count of plans detected by heartbeat
                - process_dead: count of plans detected by PID check
                - time_fallback: count of plans detected by time check
                - total_cleaned: total count of plans marked as failed
        """
        results = {
            'heartbeat_timeout': 0,
            'process_dead': 0,
            'time_fallback': 0,
            'total_cleaned': 0,
        }
        
        running_plans = Plan.objects.filter(
            status=Plan.STATUS_RUNNING,
            cancelled=False
        )
        
        for plan in running_plans:
            detected = False
            
            # Layer 1: Heartbeat Detection (highest priority)
            if self._detect_heartbeat_timeout(plan):
                self.mark_plan_as_failed(plan, "心跳超时（进程假死或系统睡眠）")
                results['heartbeat_timeout'] += 1
                detected = True
            
            # Layer 2: Process Detection (skip if already detected)
            elif not detected and self._detect_dead_process(plan):
                self.mark_plan_as_failed(plan, "训练进程已终止")
                results['process_dead'] += 1
                detected = True
            
            # Layer 3: Time-based Fallback (skip if already detected)
            elif not detected and self._detect_time_timeout(plan):
                self.mark_plan_as_failed(plan, "运行时间超过24小时")
                results['time_fallback'] += 1
                detected = True
            
            if detected:
                results['total_cleaned'] += 1
        
        if results['total_cleaned'] > 0:
            logger.info(
                f"Zombie detection complete: "
                f"{results['total_cleaned']} zombies found "
                f"(heartbeat: {results['heartbeat_timeout']}, "
                f"process: {results['process_dead']}, "
                f"time: {results['time_fallback']})"
            )
        
        return results
    
    def _detect_heartbeat_timeout(self, plan):
        """
        Layer 1: Check if heartbeat has timed out.
        
        Detects scenarios where:
        - Process is paused (laptop lid closed)
        - Process is stuck (CUDA error, deadlock)
        - Worker disconnected from Redis
        
        Args:
            plan: Plan instance to check
            
        Returns:
            bool: True if heartbeat timeout detected
        """
        # Skip if heartbeat not set (old data or not started yet)
        if not plan.last_heartbeat:
            return False
        
        heartbeat_age = now() - plan.last_heartbeat
        return heartbeat_age > self.HEARTBEAT_TIMEOUT
    
    def _detect_dead_process(self, plan):
        """
        Layer 2: Check if training process is dead.
        
        Detects scenarios where:
        - Process was killed (SIGKILL)
        - Process crashed (Segfault, OOM)
        - Worker process died
        
        Args:
            plan: Plan instance to check
            
        Returns:
            bool: True if process is dead
        """
        # Skip if PID not recorded
        if not plan.training_pid:
            return False
        
        return not self.is_process_alive(plan.training_pid)
    
    def _detect_time_timeout(self, plan):
        """
        Layer 3: Check if running time exceeds maximum.
        
        Fallback detection for edge cases not covered by other layers.
        
        Args:
            plan: Plan instance to check
            
        Returns:
            bool: True if running time exceeded
        """
        # Skip if not started
        if not plan.started_at:
            return False
        
        running_time = now() - plan.started_at
        return running_time > self.MAX_RUNNING_TIME


def detect_and_clean_zombie_plans():
    """
    Convenience function for running zombie detection.
    This is the entry point for RQ Scheduler.
    """
    detector = ZombieDetector()
    return detector.detect_and_clean_zombies()