"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging

from core.version import get_short_version
from django.contrib.auth.decorators import login_required
from django.shortcuts import render

logger = logging.getLogger(__name__)


@login_required
def plan_list(request):
    return render(request, 'plans/list.html')

@login_required
def detail_page(request, pk):
    response = {'version': get_short_version()}
    return render(request, 'base.html', response)