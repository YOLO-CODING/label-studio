"""
RQ Scheduler Configuration for Zombie Task Detection

This module configures periodic tasks for RQ Scheduler to automatically
detect and clean up zombie training tasks.
"""
import logging
from django_rq import job
from plans.zombie_detector import detect_and_clean_zombie_plans

logger = logging.getLogger(__name__)


@job('default')
def scheduled_zombie_detection():
    """
    RQ job wrapper for zombie detection.
    
    This job is scheduled to run every 5 minutes by RQ Scheduler.
    It scans all Running status plans and identifies zombie tasks.
    """
    logger.info("Starting scheduled zombie detection")
    results = detect_and_clean_zombie_plans()
    logger.info(f"Zombie detection results: {results}")
    return results


def get_scheduler_config():
    """
    Get scheduler configuration for RQ Scheduler.
    
    Returns configuration dict with periodic jobs to register.
    
    Example usage in apps.py:
        from rq_scheduler.scheduler import Scheduler
        from plans.scheduler import get_scheduler_config
        
        scheduler = Scheduler(connection=django_rq.get_connection('default'))
        for job_name, config in get_scheduler_config().items():
            scheduler.schedule(
                scheduled_time=config['scheduled_time'],
                func=config['func'],
                interval=config['interval'],
                repeat=config['repeat']
            )
    
    Returns:
        dict: Configuration for periodic jobs
    """
    from datetime import datetime
    
    return {
        'zombie_detection': {
            'func': scheduled_zombie_detection,
            'interval': 5 * 60,
            'repeat': None,
            'scheduled_time': datetime.utcnow(),
        }
    }


def register_periodic_jobs():
    """
    Register periodic jobs with RQ Scheduler.
    
    This function should be called during app startup (in apps.py ready()).
    It ensures zombie detection runs every 5 minutes.
    """
    import django_rq
    from rq_scheduler.scheduler import Scheduler
    
    try:
        scheduler = Scheduler(connection=django_rq.get_connection('default'))
        config = get_scheduler_config()
        
        for job_name, job_config in config.items():
            # Check if job already exists
            existing_jobs = scheduler.get_jobs()
            job_already_registered = any(
                job.func_name == job_config['func'].__name__
                for job in existing_jobs
            )
            
            if not job_already_registered:
                scheduler.schedule(
                    scheduled_time=job_config['scheduled_time'],
                    func=job_config['func'],
                    interval=job_config['interval'],
                    repeat=job_config['repeat']
                )
                logger.info(f"Registered periodic job: {job_name}")
            else:
                logger.info(f"Periodic job already registered: {job_name}")
        
        logger.info("All periodic jobs registered successfully")
        
    except Exception as e:
        logger.error(f"Failed to register periodic jobs: {e}")