"""
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
"""

from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Button, HTML, Hidden
from crispy_forms.bootstrap import FormActions
from django import forms
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.urls import reverse
from .layout import ModalHeader, ModalBody, ModalFooter, CancelButton
from .models import DesignTemplate

class UploadModelForm(forms.Form):
    name = forms.CharField(
        required=True,
        widget=forms.TextInput,
        label="Name"
    )
    file = forms.FileField(
        required=True,
        widget=forms.ClearableFileInput,
        label="Model File",
        help_text="Please provide a model in BioOpt or SBML format."
    )
    type = forms.CharField(
        required=True,
        widget=forms.TextInput,
        label="type"
    )
    
    def __init__(self, *args, **kwargs):
        super(UploadModelForm, self).__init__(*args, **kwargs)

        self.helper = FormHelper()
        self.helper.form_action = reverse("wedesign:upload")
        self.helper.layout = Layout(
            ModalHeader(
                'Create new model',
            ),
            ModalBody(
                'name',
                'file',
            ),
            ModalFooter(
                FormActions(
                    Button('upload-submit', 'Create Model', css_class='btn-primary'),
                    CancelButton('upload-cancel', 'Cancel')
                )
            ),
            Hidden('type', value=1)
        )

    def clean_file(self):
        #from PyNetMet2.metabolism import Metabolism

        #f = self.cleaned_data['file']

        #o = Metabolism(f)

        #if len(o.errors) > 0:
        #    raise ValidationError(", ".join(o.errors))
        pass


class ModelFromTemplateForm(forms.Form):
    name = forms.CharField(
        required=True,
        widget=forms.TextInput,
        label="Name"
    )
    choice = forms.ChoiceField(
        required=True,
        choices=(),
        label="Template model",
    )
    type = forms.CharField(
        required=True,
        widget=forms.TextInput,
        label="type"
    )

    def __init__(self, choices, *args, **kwargs):
        super(ModelFromTemplateForm, self).__init__(*args, **kwargs)

        self.fields["choice"].choices = choices
        self.helper = FormHelper()
        self.helper.form_action = reverse("wedesign:upload")
        self.helper.layout = Layout(
            ModalHeader(
                'Create new model from template',
            ),
            ModalBody(
                'name',
                'choice'
            ),
            ModalFooter(
                FormActions(
                    Button('upload-submit', 'Create Model', css_class='btn-primary'),
                    CancelButton('upload-cancel', 'Cancel')
                )
            ),
            Hidden('type', value=2)
        )

    def clean_choice(self):
        choice = self.cleaned_data['choice']

        try:
            DesignTemplate.objects.get(pk=choice)
        except ObjectDoesNotExist:
            raise ValidationError("Unknown template")

        return choice


class ModelFromBiGGForm(forms.Form):
    class ChoiceFieldNoValidation(forms.ChoiceField):
        def validate(self, value):
            pass

    name = forms.CharField(
        required=True,
        widget=forms.TextInput,
        label="Name"
    )
    choice = ChoiceFieldNoValidation(
        required=True,
        choices=(),
        label="BiGG model",
    )
    type = forms.CharField(
        required=True,
        widget=forms.TextInput,
        label="type"
    )

    def __init__(self, *args, **kwargs):
        super(ModelFromBiGGForm, self).__init__(*args, **kwargs)

        self.helper = FormHelper()
        self.helper.form_action = reverse("wedesign:upload")
        self.helper.layout = Layout(
            ModalHeader(
                'Create new model from BiGG model',
            ),
            ModalBody(
                'name',
                'choice',
                HTML('The models are downloaded from the <a href="http://bigg.ucsd.edu/">BiGG Model Database</a>.')
            ),
            ModalFooter(
                FormActions(
                    Button('upload-submit', 'Create Model', css_class='btn-primary'),
                    CancelButton('upload-cancel', 'Cancel')
                )
            ),
            Hidden('type', value=3)
        )

    def clean_choice(self):
        choice = self.cleaned_data['choice']
        if len(choice) > 20:
            raise ValidationError("bad choice")
        if not choice.replace("_", "").isalnum():
            raise ValidationError("bad choice")

        return choice


class SaveModelForm(forms.Form):
    save_summary = forms.CharField(
        required=False,
        widget=forms.TextInput,
        label="Summary",
        help_text="Briefly describe your changes to the model. They are displayed in the revision list."
    )

    def __init__(self, *args, **kwargs):
        super(SaveModelForm, self).__init__(*args, **kwargs)

        self.helper = FormHelper()
        #self.helper.form_action = reverse("wedesign:upload", kwargs={'pk': 1})
        self.helper.layout = Layout(
            ModalHeader(
                'Save model',
            ),
            ModalBody(
                'save_summary',
            ),
            ModalFooter(
                FormActions(
                    Button('save-submit', 'Save', css_class='btn-primary'),
                    CancelButton('save-cancel', 'Cancel')
                )
            ),
        )

class SaveModelAsForm(forms.Form):
    saveas_name = forms.CharField(
        required=True,
        widget=forms.TextInput,
        label="Name",
        help_text="Enter new name of model"
    )
    saveas_summary = forms.CharField(
        required=False,
        widget=forms.TextInput,
        label="Summary",
        help_text="Briefly describe your changes to the model. They are displayed in the revision list."
    )

    def __init__(self, *args, **kwargs):
        super(SaveModelAsForm, self).__init__(*args, **kwargs)

        self.helper = FormHelper()
        #self.helper.form_action = reverse("wedesign:upload", kwargs={'pk': 1})
        self.helper.layout = Layout(
            ModalHeader(
                'Save changes as new model',
            ),
            ModalBody(
                'saveas_name',
                HTML("Currently save as will only clone the model since the last savepoint. Unsaved changes are lost!")
            ),
            ModalFooter(
                FormActions(
                    Button('saveas-submit', 'Save', css_class='btn-primary'),
                    CancelButton('saveas-cancel', 'Cancel')
                )
            ),
        )
