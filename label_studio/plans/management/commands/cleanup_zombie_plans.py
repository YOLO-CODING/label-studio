import os
import logging
from django.core.management.base import BaseCommand
from django.utils.timezone import now
from datetime import timedelta
from plans.models import Plan

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = '清理僵尸训练任务（Running状态但进程已终止）'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--timeout-hours',
            type=int,
            default=1,
            help='超时阈值（小时），默认1小时',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='只检查不执行，用于测试',
        )
    
    def handle(self, *args, **options):
        timeout_hours = options['timeout_hours']
        dry_run = options['dry_run']
        
        self.stdout.write(f'检查 Running 状态超过 {timeout_hours} 小时的任务...')
        
        # 查找 Running 状态且超时的任务
        timeout_threshold = now() - timedelta(hours=timeout_hours)
        zombie_plans = Plan.objects.filter(
            status=Plan.STATUS_RUNNING,
            updated_at__lt=timeout_threshold,
        )
        
        count = zombie_plans.count()
        self.stdout.write(f'发现 {count} 个僵尸任务')
        
        if count == 0:
            return
        
        for plan in zombie_plans:
            self.stdout.write(
                f'  Plan {plan.id}: '
                f'status={plan.get_status_display()}, '
                f'updated_at={plan.updated_at}, '
                f'project={plan.project_title}'
            )
            
            if not dry_run:
                plan.status = Plan.STATUS_FAILED
                plan.failed = True
                plan.fail_message = f'训练进程异常终止（超时{timeout_hours}小时未更新）'
                plan.save()
                self.stdout.write(f'  ✓ Plan {plan.id} 已标记为 Failed')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('这是测试运行，未执行实际清理'))
        else:
            self.stdout.write(self.style.SUCCESS(f'成功清理 {count} 个僵尸任务'))