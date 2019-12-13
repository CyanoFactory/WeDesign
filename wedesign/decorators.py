"""
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
"""

def ajax_required(f):
    """
    AJAX request required decorator
    use it in your views:

    @ajax_required
    def my_view(request):
    ....

    via http://djangosnippets.org/snippets/771/
    """
    def wrap(request, *args, **kwargs):
        from django.http import HttpResponseBadRequest
        if not request.is_ajax():
            return HttpResponseBadRequest("Ajax only")
        return f(request, *args, **kwargs)
    wrap.__doc__ = f.__doc__
    wrap.__name__ = f.__name__
    return wrap
