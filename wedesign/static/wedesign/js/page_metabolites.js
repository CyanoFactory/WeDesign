/*
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
*/
define(["require", "exports", "jquery", "./design_utils", "datatables.net"], function (require, exports, $, design_utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let template = document.createElement('template');
    template.innerHTML = `
<table class="cyano-metabolite-list table table-striped table-hover">
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Compartment</th>
            <th>Consumed by</th>
            <th>Produced by</th>
            <th>Is External</th>
            <th>Chemical Formula</th>
        </tr>
    </thead>
</table>

<button type="button" class="btn btn-primary create-reaction-button">
Create new reaction
</button>
<button type="button" class="btn btn-primary create-metabolite-button">
Create new metabolite
</button>
<button type="button" class="btn btn-danger delete-metabolites-button">
Delete unused metabolites
</button>
`;
    let template_filter = document.createElement('template');
    template_filter.innerHTML = `
<div class="col-sm-6">
<label for="column-visibility-filter">Visible columns</label>
<select class="column-visibility-filter form-control combobox" multiple="multiple">
    <option>ID</option>
    <option>Name</option>
    <option>Compartment</option>
    <option>Consumed by</option>
    <option>Produced by</option>
    <option>Is External</option>
    <option>Chemical Formula</option>
</select>
<label for="cyano-list-filter">Filter metabolites</label>
<select class="cyano-list-filter form-control combobox" multiple="multiple">
    <option selected="selected">Is internal</option>
    <option selected="selected">Is external</option>
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
        //readonly filter_element: HTMLElement;
        constructor(where, app) {
            this.source_element = where;
            where.appendChild(template.content.cloneNode(true));
            this.table_element = where.getElementsByClassName("cyano-metabolite-list")[0];
            this.app = app;
            this.datatable = design_utils_1.DesignUtils.configureDatatable(this.table_element, {
                columns: [
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
                        "visible": false,
                        "data": function (rowData) {
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
                        "className": "wedesign_table_compartment",
                        "targets": 2,
                        "data": function (rowData, type, set, meta) {
                            const c = app.model.compartment.get("id", rowData.compartment);
                            if (c != null) {
                                return c.get_name_or_id();
                            }
                            return "";
                        }
                    },
                    {
                        "className": "wedesign_table_consumed",
                        "targets": 3,
                        "data": function (rowData, type, set, meta) {
                            return rowData.consumed;
                        },
                        "render": function (data, type, row, meta) {
                            return data.map(function (arg) {
                                var e = $("<span></span>").addClass("cyano-enzyme");
                                if (!arg.enabled) {
                                    e.addClass("cyano-enzyme-disabled");
                                }
                                return e.append(arg.name).wrap("<p>").parent().html();
                            }).join(", ");
                        }
                    },
                    {
                        "className": "wedesign_table_produced",
                        "targets": 4,
                        "data": function (rowData, type, set, meta) {
                            return rowData.produced;
                        },
                        "render": function (data, type, row, meta) {
                            return data.map(function (arg) {
                                var e = $("<span></span>").addClass("cyano-enzyme");
                                if (!arg.enabled) {
                                    e.addClass("cyano-enzyme-disabled");
                                }
                                return e.append(arg.name).wrap("<p>").parent().html();
                            }).join(", ");
                        }
                    },
                    {
                        "className": "wedesign_table_external",
                        "targets": 5,
                        "searchable": false,
                        "data": function (rowData, type, set, meta) {
                            return rowData.isExternal(app.model);
                        },
                        render: function (data, type, row, meta) {
                            if (type === 'copy') {
                                return data === true ? "External" : "Internal";
                            }
                            return "<div class='checkbox wedesign_external_checkbox'> \
                        <input type='checkbox' id='external" + meta.row + "' " + (data ? "checked='checked'" : "") + "> \
                        <label for='external" + meta.row + "'>External</label> \
                        </div>";
                        }
                    },
                    {
                        "className": "wedesign_table_chemical",
                        "targets": 6,
                        "visible": false,
                        "data": function (rowData, type, set, meta) {
                            return rowData.formula;
                        }
                    },
                ],
                "displayLength": 25,
                dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
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
                    else if (options.length === 2) {
                        return 'No filter applied';
                    }
                    else {
                        let labels = [];
                        options.each(function () {
                            labels.push($(this).html());
                        });
                        return labels.join(' ') + '';
                    }
                }
            });
            design_utils_1.DesignUtils.registerVisibilityFilter(where, this.datatable);
            $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
                if (settings.nTable == self.table_element) {
                    const arr = $(where).find(".cyano-list-filter").find("option").map(function () {
                        return this.selected;
                    }).get();
                    const d = self.datatable.data()[dataIndex];
                    const f = [
                        function (e) { return !e.isExternal(app.model); },
                        function (e) { return e.isExternal(app.model); }
                    ];
                    if (!(arr[0] || arr[1])) {
                        return false;
                    }
                    return ((arr[0] ? f[0](d) : !f[0](d)) || (arr[1] ? f[1](d) : !f[1](d)));
                }
                return true;
            });
            where.getElementsByClassName("cyano-regex")[0].addEventListener("click", function () {
                self.datatable.search(self.datatable.search(), $(this).prop("checked"), true).draw();
            });
            /* Event handler */
            // Tooltip on reaction hover
            $(this.table_element).on({
                mouseenter: function () {
                    $(this).data("toggle", "tooltip");
                    $(this).data("placement", "top");
                    let reaction = self.app.model.reaction.checked_get("name", $(this).text());
                    let text = reaction.toString(self.app.model);
                    $(this).prop("title", text);
                    $(this)["tooltip"]("show");
                },
                mouseleave: function () {
                }
            }, ".cyano-enzyme");
            $(this.table_element).find("tbody").on("click", ".wedesign_table_id,.wedesign_table_name", function () {
                // Open edit dialog when ID or Name are clicked
                const tr = $(this).closest("tr");
                const row = self.datatable.row(tr);
                app.dialog_metabolite.show(row.data());
            });
            $(this.table_element).find("tbody").on("click", ".wedesign_table_compartment", function () {
                // Open compartment dialog
                const tr = $(this).closest("tr");
                const row = self.datatable.row(tr);
                app.dialog_compartment.show(self.app.model.compartment.checked_get("id", row.data().compartment));
            });
            // Enzyme in consumed or produced clicked
            $(this.table_element).on("click", ".cyano-enzyme", function (event) {
                const row = self.datatable.row($(this).closest("tr"));
                const target_list = this.parentElement.className.indexOf("consumed") != -1 ?
                    row.data().consumed : row.data().produced;
                const idx = Array.prototype.indexOf.call(this.parentElement.children, this);
                app.dialog_reaction.show(target_list[idx]);
            });
            // External checkbox
            $(this.table_element).on("change", ".wedesign_external_checkbox", function () {
                const row = self.datatable.row($(this).closest("tr"));
                let metabolite = row.data();
                metabolite.compartment = $(this).is(":checked") ? "e" : "c";
                app.history_manager.push({
                    "type": "metabolite",
                    "op": "edit",
                    "id": metabolite.id,
                    "object": {
                        "id": metabolite.id,
                        "name": metabolite.name,
                        "compartment": metabolite.isExternal(app.model) ? app.model.getExternalCompartment().id : app.model.getDefaultCompartment().id
                    }
                });
                self.invalidate(metabolite);
                self.app.history_page.refresh();
            });
            // delete unused metabolites button
            $(this.source_element).find(".delete-metabolites-button").click(function (event) {
                $("#dialog-delete-metabolites")["modal"]('show');
            });
            $("#dialog-delete-metabolites").find(".btn-primary").click(function () {
                app.model.metabolites.filter(function (m) {
                    return m.isUnused();
                }).forEach(function (m) {
                    var idx = app.model.metabolite.checked_index("id", m.id);
                    app.metabolite_page.datatable.row(idx).remove();
                    m.remove(app.model);
                    app.history_manager.push({
                        "type": "metabolite",
                        "op": "delete",
                        "id": m.id,
                        "object": {}
                    });
                });
                app.metabolite_page.datatable.draw();
                self.app.history_page.refresh();
                $("#dialog-delete-metabolites")["modal"]("hide");
            });
        }
        init() {
            this.datatable.clear();
            this.datatable.rows.add(this.app.model.metabolites);
            this.refresh();
        }
        refresh() {
            this.datatable.sort();
            this.datatable.draw();
        }
        invalidate(metabolite) {
            for (let reac of metabolite.getReactions()) {
                this.app.reaction_page.datatable.row(this.app.model.reaction.checked_index("id", reac.id)).invalidate("data");
            }
            this.datatable.row(this.app.model.metabolite.checked_index("id", metabolite.id)).invalidate("data");
            this.app.simulation_page.solve();
        }
    }
    exports.Page = Page;
});
