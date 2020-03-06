"""
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ImproperlyConfigured
from django.shortcuts import render
from django.template import RequestContext
from django.template.loader import get_template

def render_queryset_to_response(request=[], queryset=None, models=[], template='', data={}, species=None):
    outformat = request.GET.get('format', 'html')

    data['queryset'] = queryset

    try:
        if outformat == 'html':
            return render(request, template, data)
        else:
            raise NotImplementedError('"%s" is not a supported export format.' % outformat)
    except (ValueError, NotImplementedError) as e:
        return render_queryset_to_response_error(request,
                                                 queryset, models[0] if models else None,
                                                 data,
                                                 species,
                                                 400,
                                                 str(e))

def render_queryset_to_response_error(request=[], queryset=None, model=None, data={}, species=None, error=403, msg="",
                                      msg_debug=""):
    import django.http as http

    _format = request.GET.get('format', 'html')

    data['species'] = species
    data['queryset'] = queryset
    data['model'] = model
    data['queryargs'] = {}

    data['is_pdf'] = False
    data['pdfstyles'] = ''

    if queryset is not None and data['queryset'].model is None:
        del data['queryset']

    response = http.HttpResponse

    if error == 400:
        data['type'] = "Bad request"
    elif error == 403:
        data['type'] = "Forbidden"
    elif error == 404:
        data['type'] = "Not Found"
    elif error == 500:
        data['type'] = "Internal Server Error"
    elif error == 503:
        data['type'] = "Service Unavailable"
    else:
        data['type'] = "Error {}".format(error)

    t = get_template('wedesign/error.html')
    data['message'] = msg

    if settings.DEBUG or (request.user.is_authenticated and request.user.is_superuser):
        data['message_extra'] = msg_debug

    return response(
        t.render(data),
        content_type='text/html; charset=UTF-8',
        status=error)


def render_crispy_form(form, helper=None, context=None):
    from crispy_forms.utils import render_crispy_form
    from django.template.context_processors import csrf
    ctx = {}
    ctx.update(csrf(context))
    return render_crispy_form(form, helper=helper, context=ctx)


def replace_guest_user(user):
    if not user.is_authenticated:
        guest_user = getattr(settings, "WEDESIGN_GUEST_USER_NAME", "guest")
        try:
            return get_user_model().objects.get(username=guest_user)
        except ObjectDoesNotExist:
            raise ImproperlyConfigured("WEDESIGN_GUEST_USER_NAME {} does not exist".format(guest_user))

    return user