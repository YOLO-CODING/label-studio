"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from django.apps import AppConfig


class PlansConfig(AppConfig):
    name = 'plans'
    
    def ready(self):
        """Register periodic jobs when app is ready"""
        # Import and register zombie detection scheduler
        # Note: This runs on every startup, so scheduler handles duplicate registration
        try:
            from plans.scheduler import register_periodic_jobs
            register_periodic_jobs()
        except Exception as e:
            # Log error but don't crash the app
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to register periodic jobs: {e}")
