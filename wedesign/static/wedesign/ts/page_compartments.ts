/*
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
*/

import * as app from "./app"
import * as mm from "./metabolic_model";
import * as $ from "jquery";
import "datatables.net";
import {DesignUtils} from "./design_utils";

let template = document.createElement('template');
template.innerHTML = `
<table class="cyano-compartment-list table table-striped table-hover">
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Members</th>
            <th>Type</th>
        </tr>
    </thead>
</table>

<p>
Default Compartment: The first compartment in the list. Metabolites whose "External" state is removed get this compartment assigned.<br>
External Compartment: The external compartment detected in this model.
</p>

<button type="button" class="btn btn-primary create-compartment-button">
Create new compartment
</button>
`;

let template_filter = document.createElement('template');
template_filter.innerHTML = `
<div class="col-sm-6">
<label for="column-visibility-filter">Visible columns</label>
<select class="column-visibility-filter form-control combobox" multiple="multiple">
    <option>ID</option>
    <option>Name</option>
    <option>Members</option>
    <option>Type</option>
</select>
`;

export class Page {
    readonly app: app.AppManager;
    readonly datatable: DataTables.Api;
    readonly source_element: HTMLElement;
    readonly table_element: HTMLElement;
    //readonly filter_element: HTMLElement;

    constructor(where: HTMLElement, app: app.AppManager) {
        this.source_element = where;
        where.appendChild(template.content.cloneNode(true));

        this.table_element = <HTMLElement>where.getElementsByClassName("cyano-compartment-list")[0]!;
        this.app = app;

        const self: Page = this;

        this.datatable = DesignUtils.configureDatatable(this.table_element, {
            columns: [
                    {},
                    {},
                    {},
                    {}
                ],
            columnDefs: [
                {
                    "className": "wedesign_table_id",
                    "targets": 0,
                    "data": function (rowData, type, set, meta) {
                        return rowData.id;
                    }
                },
                {
                    "className": "wedesign_table_name",
                    "targets": 1,
                    "data": function (rowData, type, set, meta) {
                        return rowData.get_name_or_id();
                    }
                },
                {
                    "className": "wedesign_table_members",
                    "targets": 2,
                    "render": function(data: mm.Compartment[], type, row, meta) {
                        const c = row.id;
                        let count = 0;
                        for (const met of app.model.metabolites) {
                            if (met.compartment == c) {
                                ++count;
                            }
                        }
                        return count;
                    }
                },
                {
                    "targets": 3,
                    "className": "wedesign_table_type",
                    "render": function(data: mm.Compartment[], type, row, meta) {
                        if (app.model.getExternalCompartment() == row) {
                            return "External Compartment";
                        }

                        if (app.model.getDefaultCompartment() == row) {
                            return "Default Compartment";
                        }

                        return "";
                    }
                }
            ],
            "displayLength": 25,
            dom:
                "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
                "<'row'>" +
                "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-12'B>>" +
                "<'row'<'col-sm-6'i><'col-sm-6'p>>",
            buttons: [
                {
                    extend: 'copy',
                    exportOptions: {
                        modifier: {
                            selected: true
                        },
                        orthogonal: 'copy'
                    }
                },
                {
                    extend: 'csv',
                    exportOptions: {
                        modifier: {
                            selected: true
                        },
                        orthogonal: 'copy'
                    }
                }
            ]
        });

        /* search */
        /*where.getElementsByClassName("cyano-regex")[0].addEventListener("click", function() {
            self.datatable.search(self.datatable.search(), $(this).prop("checked"), true).draw();
        });*/

        /* Event handler */

        // ID or name clicked
        $(this.table_element).find("tbody").on("click", ".wedesign_table_id,.wedesign_table_name", function() {
            let row = self.datatable.row($(this).closest("tr"));
            app.dialog_compartment.show(<mm.Compartment>row.data());
        });

        // add compartment button
        $(this.source_element).find(".create-compartment-button").on("click", function (event) {
            app.dialog_compartment.show();
        });

        /* Filter */
        where.children[0].children[1].appendChild(template_filter.content.cloneNode(true));

        DesignUtils.registerVisibilityFilter(where, this.datatable);
    }

    init() {
        this.datatable.clear();
        this.datatable.rows.add(this.app.model.compartments);
        this.refresh();
    }

    refresh() {
        this.datatable.sort();
        this.datatable.draw();
    }

    invalidate() {
        this.datatable.rows().invalidate();
        this.datatable.draw();
    }
}
