"""
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
"""

from django.db import models
from django.conf import settings

class DesignModel(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name="Saved by", on_delete=models.CASCADE, related_name='+', editable=False)
    name = models.CharField(max_length=255, null=False, blank=False, verbose_name="Name")
    filename = models.CharField(max_length=255, null=False, blank=False, verbose_name="Filename")
    content = models.TextField(verbose_name="Original content when uploaded (for debug purposes)", null=False, blank=False)

    def get_latest_revision(self):
        return self.revisions.order_by("date").last()

class Revision(models.Model):
    model = models.ForeignKey(DesignModel, related_name='revisions', on_delete=models.CASCADE, verbose_name='Model')
    sbml = models.TextField(null=False, blank=False, verbose_name="Model as SBML JSON")
    date = models.DateTimeField(auto_now=True, verbose_name = "Modification date")
    changes = models.TextField(null=False, verbose_name='Summary of changes (JSON)')
    reason = models.TextField(null=False, blank=True, default='', verbose_name='Description of changes')

    class Meta:
        ordering = ["-date"]

class DesignTemplate(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False, verbose_name="Name")
    description = models.TextField(null=False, blank=True, verbose_name="Description")
    filename = models.CharField(max_length=255, null=False, blank=False, verbose_name="Filename")
    content = models.TextField(null=False, blank=False, verbose_name="Template as SBML JSON")
