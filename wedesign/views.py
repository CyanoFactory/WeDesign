"""
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
"""

import json
import os
from io import StringIO, BytesIO, TextIOWrapper
from urllib.error import URLError

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.db.transaction import atomic
from django.http.response import HttpResponse, HttpResponseBadRequest
from django.urls import reverse
from django.views.decorators.csrf import ensure_csrf_cookie
from jsonview.decorators import json_view
from jsonview.exceptions import BadRequest

from metabolic_model import metabolic_model
from metabolic_model import sbml_parser
from metabolic_model.optgene import OptGeneParser
from metabolic_model.sbml_xml_generator import SbmlXMLGenerator, SbmlXMLGeneratorWithWeDesign
from .command_list import apply_commandlist
from .decorators import ajax_required
from .forms import UploadModelForm, ModelFromTemplateForm, SaveModelAsForm, SaveModelForm, ModelFromBiGGForm
from .helpers import render_queryset_to_response, render_queryset_to_response_error, render_crispy_form
from .models import DesignModel, Revision, DesignTemplate


def index(request):
    upload_form = UploadModelForm(None)

    templates = DesignTemplate.objects.values_list("pk", "name")
    template_form = ModelFromTemplateForm(choices=templates)
    bigg_form = ModelFromBiGGForm(None)

    if not request.user.is_authenticated:
        models = []
    else:
        models = DesignModel.objects.filter(user=request.user)

    for model in models:
        model.model_url = reverse("wedesign:design", kwargs={"pk": model.pk})
        model.delete_url = reverse("wedesign:delete", kwargs={"pk": model.pk})

    return render_queryset_to_response(
        request,
        template="wedesign/list.html",
        queryset=models,
        data={'upload_form': upload_form, "template_form": template_form, "bigg_form": bigg_form}
    )

@ensure_csrf_cookie
def design(request, pk):
    try:
        item = DesignModel.objects.get(user=request.user, pk=pk)
        current = item.get_latest_revision()
    except ObjectDoesNotExist:
        return render_queryset_to_response_error(request, error=404, msg="Model not found")

    try:
        revision = request.GET["revision"]
        try:
            revision = Revision.objects.get(model=item, pk=revision)
        except ObjectDoesNotExist:
            return render_queryset_to_response_error(request, error=404, msg="Revision not found")
    except KeyError:
        revision = current

    data = {
        "pk": pk,
        "name": item.name,
        "revision": None if current.pk == revision.pk else revision,
        "save_form": SaveModelForm(None),
        "saveas_form": SaveModelAsForm(None)
    }

    return render_queryset_to_response(request, template="wedesign/design.html", data=data)


@ajax_required
@json_view
def get_reactions(request, pk):
    try:
        item = DesignModel.objects.get(user=request.user, pk=pk)
    except ObjectDoesNotExist:
        raise BadRequest("Bad Model")

    try:
        revision = request.GET["revision"]
        if len(revision) == 0:
            revision = item.get_latest_revision()
        else:
            try:
                revision = Revision.objects.get(model=item, pk=revision)
            except ObjectDoesNotExist:
                raise BadRequest("Bad Revision")
    except KeyError:
        revision = item.get_latest_revision()

    return json.loads(revision.sbml)["sbml"]["model"]


@ajax_required
@json_view
def get_revisions(request, pk):
    try:
        item = DesignModel.objects.get(user=request.user, pk=pk)
    except ObjectDoesNotExist:
        raise BadRequest("Bad Model")

    revision = Revision.objects.filter(model=item).order_by("date").values("id", "reason", "date", "changes")
    if len(revision) == 0:
        raise BadRequest("Bad Revision")

    prev_id = None
    for rev in revision:
        if rev["changes"]:
            rev["changes"] = json.loads(rev["changes"])
        prev_id, rev["id"] = rev["id"], prev_id
        rev["date"] = str(rev["date"])

    return list(revision)

def export(request, pk):
    form = request.GET.get("format")

    if form not in ["bioopt", "sbml", "sbml_wedesign", "json"]:
        return HttpResponseBadRequest("Bad format")

    try:
        model = DesignModel.objects.get(user=request.user, pk=pk)
        content = model.get_latest_revision().sbml
    except ObjectDoesNotExist:
        return HttpResponseBadRequest("Bad Model")

    if form.startswith("sbml"):
        xml_handle = StringIO()
        cls = SbmlXMLGenerator if form == "sbml" else SbmlXMLGeneratorWithWeDesign
        writer = cls(xml_handle, "utf-8")

        writer.startDocument()
        metabolic_model.MetabolicModel.from_json(json.loads(content)).write_sbml(writer)
        writer.endDocument()

        import xml.dom.minidom
        dom = xml.dom.minidom.parseString(xml_handle.getvalue())
        out = StringIO()
        out.write(dom.toprettyxml())

        export_data = out.getvalue()
    elif form == "bioopt":
        parsed_model = metabolic_model.MetabolicModel.from_json(json.loads(content))
        out = StringIO()
        OptGeneParser.from_model(parsed_model, include_compartment=False).write(out)

        export_data = out.getvalue()
    elif form == "json":
        export_data = json.dumps(json.loads(content), indent='\t')
    else:
        raise BadRequest("Bad format")

    types = dict(
        bioopt="application/x-bioopt",
        sbml="application/sbml+xml",
        sbml_wedesign="application/sbml+xml",
        json="application/json"
    )

    exts = dict(
        bioopt=".txt",
        sbml=".xml",
        sbml_wedesign=".xml",
        json=".json"
    )

    response = HttpResponse(
        export_data,
        content_type=types[form]
    )

    filename = os.path.splitext(model.filename)[0] + exts[form]

    response['Content-Disposition'] = "attachment; filename=" + filename

    return response


@login_required
@ajax_required
@json_view
def save(request, pk):
    if not all(x in request.POST for x in ["changes"]):
        raise BadRequest("Request incomplete")

    try:
        model = DesignModel.objects.get(user=request.user, pk=pk)
    except ObjectDoesNotExist:
        raise BadRequest("Bad Model")

    try:
        changes = json.loads(request.POST["changes"])
    except ValueError:
        raise BadRequest("Invalid JSON data")

    if len(changes) == 0:
        raise BadRequest("Model not saved: No changes found")

    summary = request.POST.get("summary")

    groups = []
    # Sanitize:
    # Check that group ID is the same everywhere
    for change in changes:
        group = change.get("group")
        if group is None:
            raise BadRequest("Invalid JSON data")
        idd = group.get("id")
        groups.append(idd)
        # Delete group, storing not needed
        del change["group"]
    if len(set(groups)) != 1:
        raise BadRequest("Invalid history data")

    # When group ID not -1 check if the revision exists
    if groups[0] != -1:
        try:
            revision = Revision.objects.get(model=model, pk=groups[0])
        except ObjectDoesNotExist:
            raise BadRequest("Bad Revision")
    else:
        revision = model.get_latest_revision()
        pass

    org = metabolic_model.MetabolicModel.from_json(json.loads(revision.sbml))

    try:
        apply_commandlist(org, changes)
    except ValueError as e:
        raise BadRequest("Model error: " + str(e))

    for reac in org.reactions:
        reac.update_parameters_from_bounds(org)

    if groups[0] != -1:
        # Delete all revisions after this one
        Revision.objects.filter(model=model, date__gt=revision.date).delete()

    rev = Revision(
        model=model,
        sbml=org.to_json(),
        changes=json.dumps(changes),
        reason=summary
    )

    rev.save()

    return {"history_id": rev.pk}


@login_required
@ajax_required
@json_view
def save_as(request, pk):
    # TODO: This currently only clones the model and ignores all changes
    if request.method == 'POST':
        form = SaveModelAsForm(request.POST, request.FILES)

        if form.is_valid():
            name = form.cleaned_data.get('saveas_name')

            try:
                model = DesignModel.objects.get(user=request.user, pk=pk)
            except ObjectDoesNotExist:
                raise BadRequest("Bad Model")

            all_revs = model.revisions.order_by("date")

            model.name = name
            model.pk = None
            model.save()

            for rev in all_revs:
                rev.model = model
                rev.pk = None
                rev.save()

            return {'success': True, 'url': reverse("wedesign:design", kwargs={"pk":model.pk})}
        else:
            form_html = render_crispy_form(form, context=request)
            return {'success': False, 'form_html': form_html}

    raise BadRequest()

@login_required
@json_view
@atomic
def upload(request):
    if request.method == 'POST':
        pk = request.POST.get("type")

        if pk == "1":
            # Uploaded model
            form = UploadModelForm(request.POST, request.FILES)

            if form.is_valid():
                name = form.cleaned_data.get('name')

                freq = request.FILES['file']
                filename = freq.name

                binary = BytesIO()
                for chunk in freq.chunks():
                    binary.write(chunk)
                binary.seek(0)

                if binary.read(1) == b'\x1f' and binary.read(1) == b'\x8b':
                    # gzip
                    binary.seek(0)
                    import gzip
                    data = gzip.decompress(binary.getvalue())
                    binary = BytesIO()
                    binary.write(data)

                binary.seek(0)

                def skip_bom(s):
                    # fixme
                    s.seek(0)

                try:
                    ss = TextIOWrapper(binary, encoding='utf-8')
                    skip_bom(ss)

                    try:
                        if ss.readline().startswith("<?xml"):
                            format = "sbml"
                        else:
                            format = "opt"
                    finally:
                        skip_bom(ss)

                    if format == "sbml":
                        sbml_handler = sbml_parser.SbmlHandler()
                        sbml_parser.push_handler(sbml_handler)
                        content = ss.read()
                        skip_bom(ss)
                        # closes ss
                        sbml_parser.parser.parse(ss)
                        model = sbml_handler.model
                    else:
                        content = ss.read()
                        skip_bom(ss)
                        bioopt = OptGeneParser(ss)
                        model = bioopt.to_model()
                except UnicodeDecodeError:
                    form.add_error("file", "File does not have UTF-8 encoding")
                    form_html = render_crispy_form(form, context=request)
                    return {'success': False, 'form_html': form_html}

                if len(model.reactions) == 0 or len(model.metabolites) == 0:
                    form.add_error("file", "Model is empty")
                    form_html = render_crispy_form(form, context=request)
                    return {'success': False, 'form_html': form_html}

                #except Exception as e:
                #    form.add_error("file", "Not a valid model: " + str(e))
                #    form_html = render_crispy_form(form, context=request)
                #    return {'success': False, 'form_html': form_html}

                dm = DesignModel.objects.create(
                    user=request.user,
                    name=name,
                    filename=filename,
                    content=content
                )

                Revision(
                    model=dm,
                    sbml=model.to_json(),
                    reason="Initial version"
                ).save()

                return {'success': True}
            else:
                form_html = render_crispy_form(form, context=request)
                return {'success': False, 'form_html': form_html}
        elif pk == "2":
            # from template
            templates = DesignTemplate.objects.values_list("pk", "name")
            form = ModelFromTemplateForm(templates, request.POST, request.FILES)

            if form.is_valid():
                name = form.cleaned_data.get('name')
                choice = form.cleaned_data.get('choice')

                template = DesignTemplate.objects.get(pk=choice)

                dm = DesignModel.objects.create(
                    user=request.user,
                    name=name,
                    filename=template.filename,
                    content=template.content
                )

                Revision(
                    model=dm,
                    sbml=template.content,
                    reason="Initial version"
                ).save()

                return {'success': True}
            else:
                form_html = render_crispy_form(form, context=request)
                return {'success': False, 'form_html': form_html}
        elif pk == "3":
            # from BiGG
            form = ModelFromBiGGForm(request.POST, request.FILES)
            if form.is_valid():
                import urllib
                import gzip

                name = form.cleaned_data.get('name')
                choice = form.cleaned_data.get('choice')
                url = "http://bigg.ucsd.edu/static/models/" + choice + ".xml.gz"
                try:
                    response = urllib.request.urlopen(url)
                except URLError:
                    form_html = render_crispy_form(form, context=request)
                    return {'success': False, 'form_html': form_html}

                data = gzip.decompress(response.read())
                binary = BytesIO()
                binary.write(data)
                binary.seek(0)

                ss = TextIOWrapper(binary, encoding='utf-8')

                sbml_handler = sbml_parser.SbmlHandler()
                sbml_parser.push_handler(sbml_handler)
                content = ss.read()
                ss.seek(0)
                # closes ss
                sbml_parser.parser.parse(ss)
                model = sbml_handler.model

                dm = DesignModel.objects.create(
                    user=request.user,
                    name=name,
                    filename=choice + ".xml",
                    content=content
                )

                Revision(
                    model=dm,
                    sbml=model.to_json(),
                    reason="Initial version"
                ).save()

                return {'success': True}

    raise BadRequest()

@login_required
@ajax_required
@json_view
def delete(request, pk):
    try:
        DesignModel.objects.get(user=request.user, pk=pk).delete()
    except ObjectDoesNotExist:
        raise BadRequest("Bad Model")

    return {}

def history(request, pk):
    try:
        model = DesignModel.objects.get(user=request.user, pk=pk)
        revisions = model.revisions.all()
    except ObjectDoesNotExist:
        return render_queryset_to_response_error(request, error=404, msg="Model not found")

    entries = []

    from itertools import groupby
    for k,v in groupby(revisions, key=lambda x: x.date.date()):
        v = list(v)[::-1]
        for vv in v:
            try:
                if vv.changes:
                    vv.changes = json.loads(vv.changes)
            except KeyError:
                vv.changes = {}

        entries.append([k, list(v)[::-1]])

    data = {"model": model, "revisions": entries}

    return render_queryset_to_response(request, template="wedesign/history.html", data=data)
