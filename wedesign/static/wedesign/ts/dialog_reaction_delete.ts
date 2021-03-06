/*
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
*/

import * as app from "./app"
import * as mm from "./metabolic_model";
import * as $ from "jquery";
import "datatables.net";

let template = document.createElement('template');
template.innerHTML = `
<div class="dialog-delete modal fade" tabindex="-1" role="dialog" aria-labelledby="dialog-delete-label"
     aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                        aria-hidden="true">&times;</span></button>
                <h4 class="modal-title dialog-delete-label">Delete <span class="reaction-name"></span></h4>
            </div>
            <div class="modal-body">
                Do you really want to delete reaction <span class="reaction-name"></span>?

                <div class="form-group">
                <div class="checkbox">
                    <input class="delete-unused-metabolites" type="checkbox">
                    <label for="dialog-delete-unused-metabolites">Delete unused metabolites</label>
                </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary btn-danger">Delete</button>
                <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
        </div>
    </div>
</div>
`;

export class Dialog {
    readonly app: app.AppManager;
    readonly model: mm.Model;
    readonly dialog_element: HTMLElement;
    private item: mm.Reaction = null;

    constructor(app: app.AppManager) {
        this.app = app;

        document.body.appendChild(template.content.cloneNode(true));
        this.dialog_element = <HTMLElement>document.body.getElementsByClassName("dialog-delete")[0]!;
        const self: Dialog = this;
        $(this.dialog_element).find(".btn-primary").click(function () {
            self.ok_clicked();
        });
    }

    show(reaction: mm.Reaction) {
        // cleanup
        $(this.dialog_element).find(".delete-unused-metabolites").prop("checked", false);

        this.item = reaction;

        $(this.dialog_element).find(".reaction-name").text(reaction.get_name_or_id());

        // show
        $(this.dialog_element)["modal"]("show");
    }

    ok_clicked(): void {
        let rmets: mm.Metabolite[] = this.item.getMetabolites(this.app.model);
        let del_mets: boolean = $(this.dialog_element).find(".delete-unused-metabolites").prop("checked");

        (<any>this.app.reaction_page.datatable.row(
            this.app.model.reaction.checked_index("id", this.item.id))).remove();

        this.item.remove(this.app.model);

        for (let met of this.item.getMetabolites(this.app.model)) {
            this.app.metabolite_page.invalidate(met);
        }

        this.app.history_manager.push({
            "op": "delete",
            "type": "reaction",
            "id": this.item.id,
            "object": {
                "id": this.item.id
            }
        });

        if (del_mets) {
            rmets.filter((m: mm.Metabolite) => {
                // this.app.metabolite_page.invalidate(m);
                return del_mets && m.isUnused();
            }).forEach((m: mm.Metabolite) => {
                (<any>this.app.metabolite_page.datatable.row(
                    this.app.model.metabolite.checked_index("id", m.id))).remove();

                m.remove(this.app.model);

                this.app.history_manager.push({
                    "type": "metabolite",
                    "op": "delete",
                    "id": m.id,
                    "object": {}
                });

            });
        }

        this.app.reaction_page.refresh();
        this.app.metabolite_page.refresh();
        this.app.settings_page.refresh([this.item]);
        this.app.history_page.refresh();

        $(this.dialog_element)["modal"]("hide");
    }
}
