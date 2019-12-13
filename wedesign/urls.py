"""
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
"""

from django.urls.conf import path
from . import views

app_name = "wedesign"

api_prefix = "api/v1/models"
api_prefix_model = api_prefix + "/<int:pk>"

urlpatterns = [
    # REST API
    #url(api_prefix, views.models, name="models"),
    path(api_prefix + '/upload', views.upload, name="upload"),
    path(api_prefix_model + '/reactions', views.get_reactions, name="reactions"),
    path(api_prefix_model + '/revisions', views.get_revisions, name="revisions"),
    path(api_prefix_model + '/export', views.export, name="export"),
    path(api_prefix_model + '/delete', views.delete, name="delete"),
    path(api_prefix_model + '/save', views.save, name="save"),
    path(api_prefix_model + '/duplicate', views.save_as, name="duplicate"),

    # Web Interface
    path('<int:pk>/edit', views.design, name="design"),
    path('<int:pk>/history', views.history, name="history"),

    path('', views.index, name="index"),
]
