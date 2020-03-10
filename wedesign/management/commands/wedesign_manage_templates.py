"""
Copyright (c) 2020 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
"""

from django.core.exceptions import ObjectDoesNotExist
from django.core.management import CommandError
from django.core.management.base import BaseCommand
from wedesign.metabolic_model import converter
from wedesign.models import DesignTemplate
import os


class Command(BaseCommand):
    args = 'file'
    help = 'Manage templates for WeDesign'

    def add_arguments(self, parser):
        parser.add_argument('--add',
                    action='store',
                    dest='add',
                    help='Add or edit (based on --name) model (SBML or OptGene) specified by FILE'),
        parser.add_argument('--name',
                    action='store',
                    dest='name',
                    help='Human readable name of the model (required when --add is used)'),
        parser.add_argument('--description',
                    action='store',
                    dest='description',
                    default='',
                    help='Optional description of the model (when --add is used)'),
        parser.add_argument('--delete',
                    action='store',
                    dest='delete',
                    type=int,
                    help='Delete template specified by ID'),
        parser.add_argument('--list',
                    action='store_true',
                    dest='list',
                    help='List all available models'),
        parser.add_argument('--get',
                    action='store',
                    dest='get',
                    type=int,
                    default=0,
                    help='Get model metadata by ID'),
        parser.add_argument('--get-data',
                    action='store',
                    dest='get_data',
                    type=int,
                    default=0,
                    help='Retrieve json data of a template by ID')

    def handle(self, *args, **options):
        if options["add"]:
            if not options["name"]:
                raise CommandError("Missing required argument: --name")

            filename = options["add"]
            f = open(filename, "rb")
            model, content = converter.from_stream(f)

            try:
                dt = DesignTemplate.objects.get(name=options["name"])
                print("Updating existing template " + dt.name)
            except ObjectDoesNotExist:
                dt = DesignTemplate(name=options["name"])
                print("Creating new template " + dt.name)

            dt.description = options["description"]
            dt.filename = os.path.basename(filename)
            dt.content = model.to_json()
            dt.save()
        elif options["list"]:
            objects = DesignTemplate.objects.filter().order_by("pk")
            for obj in objects:
                print("{}: {} ({})".format(obj.pk, obj.name, obj.description))
        elif options["get"]:
            try:
                obj = DesignTemplate.objects.get(pk=options["get"])
            except ObjectDoesNotExist as e:
                raise CommandError(e)
            print("{}: {} ({})".format(obj.pk, obj.name, obj.description))
        elif options["get_data"]:
            try:
                obj = DesignTemplate.objects.get(pk=options["get_data"])
            except ObjectDoesNotExist as e:
                raise CommandError(e)
            print(obj.content)
        elif options["delete"]:
            try:
                obj = DesignTemplate.objects.get(pk=options["delete"])
            except ObjectDoesNotExist as e:
                raise CommandError(e)
            print("Deleting template " + obj.name)
            obj.delete()

