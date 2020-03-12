/*
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
*/
define(["require", "exports", "jquery", "datatables.net"], function (require, exports, $) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let template = document.createElement('template');
    template.innerHTML = `
<table class="cyano-reaction-list table table-striped table-hover">
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Reaction</th>
            <th>Constraint</th>
            <th>Flux</th>
            <th>Active</th>
            <th></th>
        </tr>
    </thead>
</table>

<div class="cyano-reaction-buttons btn-group">
    <button type="button" class="btn btn-primary create-enzyme-button">
    Create new reaction
    </button>
    <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <span class="caret"></span>
        <span class="sr-only">Toggle Dropdown</span>
    </button>
    <ul class="dropdown-menu">
        <li><a href="#" class="create-enzyme-bulk-button">Bulk add reactions</a></li>
    </ul>
</div>

<button type="button" class="btn btn-primary create-metabolite-button">
Create new metabolite
</button>
`;
    let template_filter = document.createElement('template');
    template_filter.innerHTML = `
<div class="col-sm-6">
<label for="column-visibility-filter">Visible columns</label>
<select class="column-visibility-filter form-control combobox" multiple="multiple">
    <option value="id">ID</option>
    <option selected="selected">Name</option>
    <option selected="selected">Reaction</option>
    <option selected="selected">Constraints</option>
    <option selected="selected">Flux</option>
    <option selected="selected">Active</option>
    <option selected="selected">Delete</option>
</select>
<label for="cyano-list-filter">Filter reactions</label>
<select class="cyano-list-filter form-control combobox" multiple="multiple">
    <optgroup label="Enabled">
    <option selected="selected">Active</option>
    <option selected="selected">Inactive</option>
    </optgroup>
    <optgroup label="Constraints">
    <option selected="selected">Constraint</option>
    <option selected="selected">Unconstraint</option>
    </optgroup>
    <optgroup label="Reversible">
    <option selected="selected">Reversible</option>
    <option selected="selected">Irreversible</option>
    </optgroup>
</select>
</div>
<div class="col-sm-6">
    <div class="dataTables_filter">
    <div class="checkbox">
    <input class="cyano-regex" type="checkbox">
    <label for="cyano-regex">Search with RegExp</label>
    </div>
    </div>
</div>
`;
    class Page {
        constructor(where, app) {
            this.flux = {};
            this.source_element = where;
            where.appendChild(template.content.cloneNode(true));
            this.table_element = where.getElementsByClassName("cyano-reaction-list")[0];
            this.app = app;
            this.datatable = $(this.table_element).DataTable({
                "deferRender": true,
                "autoWidth": false,
                columns: [
                    {},
                    {},
                    {},
                    {},
                    {},
                    {},
                    {},
                    {}
                ],
                columnDefs: [
                    {
                        "className": "wedesign_table_id",
                        "targets": 0,
                        "width": "20%",
                        "visible": false,
                        "data": function (rowData) {
                            return rowData.id;
                        }
                    },
                    {
                        "className": "wedesign_table_name",
                        "targets": 1,
                        "width": "20%",
                        "data": function (rowData) {
                            return rowData;
                        },
                        render: function (data) {
                            let e = $("<span>");
                            if (!data.enabled) {
                                e.addClass("cyano-enzyme-disabled");
                            }
                            return e.text(data.get_name_or_id()).wrap("<p>").parent().html();
                        }
                    },
                    {
                        "className": "wedesign_table_reactions",
                        "targets": 2,
                        "width": "100%",
                        "orderable": false,
                        "data": function (rowData) {
                            return rowData;
                        },
                        render: function (data) {
                            return $(data.toHtml(app.model)).wrap("<p>").parent().html();
                        }
                    },
                    {
                        "className": "wedesign_table_constraints",
                        "targets": 3,
                        "width": "0%",
                        "orderable": true,
                        "searchable": false,
                        "data": function (rowData) {
                            return rowData.constraintsToString(self.app.model);
                        }
                    },
                    {
                        "className": "wedesign_table_flux",
                        "targets": 4,
                        "width": "0%",
                        "searchable": false,
                        "data": function (rowData) {
                            if (rowData.id in self.flux) {
                                return self.flux[rowData.id];
                            }
                            return "";
                        }
                    },
                    {
                        "className": "wedesign_table_enabled",
                        "targets": 5,
                        "orderable": false,
                        "searchable": false,
                        "data": function (rowData) {
                            return rowData.enabled;
                        },
                        render: function (data, type, row, meta) {
                            if (type === 'copy') {
                                return data === true ? "Enabled" : "Disabled";
                            }
                            return "<div class='checkbox'> \
                        <input type='checkbox' class='enabled-button' id='enabled" + meta.row + "' " + (data ? "checked='checked'" : "") + "> \
                        <label for='enabled" + meta.row + "'>Enabled</label> \
                        </div>";
                        }
                    },
                    {
                        "className": "wedesign_table_delete",
                        "targets": 6,
                        "width": "0%",
                        "orderable": false,
                        "searchable": false,
                        "data": function (rowData, type, set, meta) {
                            return rowData;
                        },
                        "render": function (data, type, row, meta) {
                            return "<a class='btn btn-default btn-xs delete-button'>Delete</a>";
                        }
                    },
                    {
                        "className": "wedesign_table_pathway",
                        "targets": 7,
                        "visible": false,
                        "orderable": true,
                        "data": function (rowData, type, set, meta) {
                            return "No Pathway";
                            // FIXME return rowData.pathway.length == 0 ? "No Pathway" : rowData.pathway;
                        }
                    }
                ],
                drawCallback: function (settings) {
                    var api = this.api();
                    var rows = api.rows({ page: 'current' }).nodes();
                    var last = null;
                    /*api.column(5, {page:'current'} ).data().each( function ( group, i ) {
                        if ( last !== group ) {
                            $(rows).eq( i ).before(
                                '<tr class="group"><td colspan="5">'+group+'</td></tr>'
                            );
    
                            last = group;
                        }
                    } );*/
                },
                "displayLength": 25,
                "order": [[0, 'asc']],
                dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
                    "<'row'>" +
                    "<'row'<'col-sm-12'tr>>" +
                    "<'row'<'col-sm-12'B>>" +
                    "<'row'<'col-sm-6'i><'col-sm-6'p>>",
                buttons: [
                    {
                        extend: 'copy',
                        exportOptions: {
                            columns: [0, 1, 2, 3],
                            modifier: {
                                selected: true
                            },
                            orthogonal: 'copy'
                        }
                    },
                    {
                        extend: 'csv',
                        exportOptions: {
                            columns: [0, 1, 2, 3],
                            modifier: {
                                selected: true
                            },
                            orthogonal: 'copy'
                        }
                    }
                ]
            });
            /* Filter */
            where.children[0].children[1].appendChild(template_filter.content.cloneNode(true));
            const self = this;
            $(where.getElementsByClassName("cyano-list-filter")[0]).multiselect({
                buttonClass: 'btn btn-default btn-xs',
                onChange: function (option, checked, select) {
                    self.datatable.draw();
                },
                buttonText: function (options, select) {
                    if (options.length === 0) {
                        return 'No option selected';
                    }
                    else if (options.length === 6) {
                        return 'No filter applied';
                    }
                    else {
                        let labels = [];
                        let prev = null;
                        let omit_group = false;
                        let enabled = [];
                        for (let i = 0; i < 6; ++i) {
                            enabled.push("");
                        }
                        for (let i = 0; i < options.length; ++i) {
                            enabled[options[i].index] = options[i].text;
                        }
                        for (let i = 0; i < enabled.length; i += 2) {
                            let one_of = (enabled[i].length > 0 && enabled[i + 1].length == 0) ||
                                (enabled[i].length == 0 && enabled[i + 1].length > 0);
                            let none_of = (enabled[i].length == 0 && enabled[i + 1].length == 0);
                            if (none_of) {
                                return "No option selected";
                            }
                            if (one_of) {
                                if (enabled[i].length > 0) {
                                    labels.push(enabled[i]);
                                }
                                else if (enabled[i + 1].length > 0) {
                                    labels.push(enabled[i + 1]);
                                }
                                labels.push("AND");
                            }
                        }
                        labels.pop();
                        return labels.join(' ') + '';
                    }
                }
            });
            $(where.getElementsByClassName("column-visibility-filter")[0]).multiselect({
                buttonClass: 'btn btn-default btn-xs',
                onChange: function (option, checked, select) {
                    for (const opt of option) {
                        self.datatable.column(opt.index).visible(checked);
                    }
                },
                buttonText: function (options, select) {
                    if (options.length === 0) {
                        return 'None';
                    }
                    else if (options.length === 7) {
                        return 'All';
                    }
                    else {
                        return `Some (${options.length})`;
                    }
                }
            });
            // Order by the grouping
            /*table_enzymes.delegate('tr.group', 'click', function() {
                var currentOrder = datatable_enzymes.order()[0];
                if ( currentOrder[0] === 2 && currentOrder[1] === 'asc' ) {
                    datatable_enzymes.order( [ 5, 'desc' ] ).draw();
                }
                else {
                    datatable_enzymes.order( [ 5, 'asc' ] ).draw();
                }
            } );*/
            $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
                if (settings.nTable == self.table_element) {
                    const arr = $(where).find(".cyano-list-filter").find("option").map(function () {
                        return this.selected;
                    }).get();
                    const d = self.datatable.data()[dataIndex];
                    const f = [
                        function (e) { return e.enabled; },
                        function (e) { return !e.enabled; },
                        function (e) { return e.isConstrained(self.app.model); },
                        function (e) { return !e.isConstrained(self.app.model); },
                        function (e) { return e.reversible; },
                        function (e) { return !e.reversible; }
                    ];
                    if (!(arr[0] || arr[1]) || !(arr[2] || arr[3]) || !(arr[4] || arr[5])) {
                        return false;
                    }
                    return ((arr[0] ? f[0](d) : !f[0](d)) || (arr[1] ? f[1](d) : !f[1](d))) &&
                        ((arr[2] ? f[2](d) : !f[2](d)) || (arr[3] ? f[3](d) : !f[3](d))) &&
                        ((arr[4] ? f[4](d) : !f[4](d)) || (arr[5] ? f[5](d) : !f[5](d)));
                }
                return true;
            });
            where.getElementsByClassName("cyano-regex")[0].addEventListener("click", function () {
                self.datatable.search(self.datatable.search(), $(this).prop("checked"), true).draw();
            });
            /* Event handler */
            $(this.table_element).find("tbody").on("click", ".wedesign_table_id,.wedesign_table_name", function () {
                // Open edit dialog when ID or Name are clicked
                const tr = $(this).closest("tr");
                if (tr.hasClass("group")) {
                    return;
                }
                const row = self.datatable.row(tr);
                self.app.dialog_reaction.show(row.data());
            });
            // Any Metabolite was clicked
            $(this.table_element).on("click", ".cyano-metabolite", function (event) {
                const met = self.app.model.metabolite.checked_get("id", this.dataset.id);
                self.app.dialog_metabolite.show(met);
            });
            // Enabled checkbox
            $(this.table_element).on("change", ".enabled-button", function () {
                let row = self.datatable.row($(this).closest("tr"));
                let reaction = row.data();
                reaction.enabled = ($(this).is(":checked"));
                app.history_manager.push({
                    "type": "reaction",
                    "op": "edit",
                    "id": reaction.id,
                    "object": {
                        "id": reaction.id,
                        "enabled": reaction.enabled
                    }
                });
                self.invalidate(reaction);
                self.app.history_page.refresh();
            });
            // delete button clicked
            $(this.table_element).on("click", ".delete-button", function () {
                let row = self.datatable.row($(this).closest("tr"));
                let reaction = row.data();
                self.app.dialog_reaction_delete.show(reaction);
            });
        }
        init() {
            this.datatable.clear();
            this.datatable.rows.add(this.app.model.reactions);
            for (let reaction of this.app.model.reactions) {
                reaction.updateMetaboliteReference(this.app.model);
            }
            this.refresh();
        }
        refresh() {
            this.datatable.sort();
            this.datatable.draw();
        }
        invalidate(reaction) {
            for (let met_id of reaction.getMetaboliteIds(this.app.model)) {
                let idx = this.app.model.metabolite.checked_index("id", met_id);
                this.app.metabolite_page.datatable.row(idx).invalidate("data");
            }
            this.app.metabolite_page.datatable.draw();
            this.datatable.row(this.app.model.reaction.checked_index("id", reaction.id)).invalidate();
            this.app.simulation_page.solve();
        }
    }
    exports.Page = Page;
});
