define(["require", "exports", "jquery", "./design_utils", "datatables.net"], function (require, exports, $, design_utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let template = document.createElement('template');
    template.innerHTML = `
<div class="checkbox">
    <input type="checkbox" name="remember-simulation" id="remember-simulation">
    <label for="remember-simulation">Combine results with previous simulation</label>
</div>
<button type="button" class="design-submit btn btn-primary">Run simulation</button>
<div class="export-button-graph btn-group">
    <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
    Export Graph <span class="caret"></span>
    </button>
    <ul class="dropdown-menu" role="menu">
    <!--<li><a id="export-csv" href="#">As flux list</a></li>-->
    <li><a class="export-png" href="#">As image</a></li>
    <li><a class="export-svg" href="#">As vector graphic</a></li>
    <li><a class="export-dot" href="#">As GraphViz dot file</a></li>
    </ul>
</div>
<div class="export-button-chart btn-group">
    <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
    Export Chart <span class="caret"></span>
    </button>
    <ul class="dropdown-menu" role="menu">
    <!--<li><a id="export-csv" href="#">As flux list</a></li>-->
    <li><a class="export-png" href="#">As image</a></li>
    <li><a class="export-svg" href="#">As vector graphic</a></li>
    <li><a class="export-csv" href="#">As CSV</a></li>
    </ul>
</div>
<div class="export-button-flux btn-group">
    <button type="button" class="btn btn-primary export-flux-escher" aria-expanded="false">
    Export Flux (for Escher)</span>
    </button>
</div>

<div class="simulation-result">
</div>

<div class="visual-graph">
</div>

<div class="visual-fba">
</div>

<table class="cyano-flux-list table table-striped table-hover">
    <thead>
        <tr>
            <th>Name</th>
            <th>Flux</th>
        </tr>
    </thead>
</table>
`;
    let template_filter = document.createElement('template');
    template_filter.innerHTML = `
<div class="col-sm-3">
    <div class="form-group">
        <label class="control-label" for="filter-flux-min">Min Flux:</label>
        <input class="filter-flux-min form-control" type="text">
    </div>
</div>
<div class="col-sm-3">
        <label class="control-label" for="filter-flux-max">Max Flux:</label>
        <input class="filter-flux-max form-control" type="text">
</div>
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
            this.last_sim_type = "";
            this.last_sim_flux = 0;
            this.last_sim_objective = null;
            this.last_sim_design_objecive = null;
            this.last_dot_graph = "";
            this.last_target_obj_results = [];
            this.simulation_chart = null;
            this.is_dragging = false;
            this.source_element = where;
            where.appendChild(template.content.cloneNode(true));
            this.table_element_flux = where.getElementsByClassName("cyano-flux-list")[0];
            this.simulation_result_element = where.getElementsByClassName("simulation-result")[0];
            this.visual_graph_element = where.getElementsByClassName("visual-graph")[0];
            this.visual_fba_element = where.getElementsByClassName("visual-fba")[0];
            this.export_button_graph = where.getElementsByClassName("export-button-graph")[0];
            this.export_button_chart = where.getElementsByClassName("export-button-chart")[0];
            this.export_button_flux = where.getElementsByClassName("export-button-flux")[0];
            this.app = app;
            this.datatable_flux = $(this.table_element_flux).DataTable({
                "deferRender": true,
                "displayLength": 25,
                "order": [[1, 'desc']],
                "language": {
                    "emptyTable": "The fluxes are displayed here after running a simulation"
                },
                columnDefs: [
                    {
                        "targets": 0
                    },
                    {
                        "targets": 1
                    }
                ],
                dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
                    "<'row'>" +
                    "<'row'<'col-sm-12'tr>>" +
                    "<'row'<'col-sm-12'B>>" +
                    "<'row'<'col-sm-5'i><'col-sm-7'p>>",
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
            let self = this;
            $(this.source_element).find(".design-submit").click(function (event) {
                self.simulate();
            });
            $(this.export_button_graph).find(".export-svg").click(() => design_utils_1.DesignUtils.downloadSVG(this.visual_fba_element.children[0], "graph.svg"));
            $(this.export_button_graph).find(".export-png").click(() => design_utils_1.DesignUtils.downloadPNG(this.visual_fba_element.children[0], "graph.png"));
            $(this.export_button_graph).find(".export-dot").click(() => design_utils_1.DesignUtils.downloadText(this.last_dot_graph, "graph.dot"));
            $(this.export_button_chart).find(".export-svg").click(() => design_utils_1.DesignUtils.downloadSVG(this.visual_graph_element.children[0], "chart.svg"));
            $(this.export_button_chart).find(".export-png").click(() => design_utils_1.DesignUtils.downloadPNG(this.visual_graph_element.children[0], "chart.png"));
            $(this.export_button_chart).find(".export-csv").click(() => design_utils_1.DesignUtils.downloadCSV(this.createCsv(), "chart.csv"));
            $(this.export_button_flux).find(".export-flux-escher").click(() => {
                if (this.app.settings_page.getObjective() == "") {
                    return;
                }
                let out_flux = {};
                for (let k in this.app.reaction_page.flux) {
                    if (!this.app.reaction_page.flux.hasOwnProperty(k)) {
                        continue;
                    }
                    let kk = k;
                    if (k.startsWith("R_")) {
                        kk = k.substr(2);
                    }
                    out_flux[kk] = this.app.reaction_page.flux[k];
                }
                design_utils_1.DesignUtils.downloadJson(JSON.stringify(out_flux), "flux.json");
            });
            $(this.export_button_graph).hide();
            $(this.export_button_chart).hide();
            // Filter
            where.children[8].children[1].appendChild(template_filter.content.cloneNode(true));
            $(where).find(".filter-flux-min").change(function () { self.datatable_flux.draw(); });
            $(where).find(".filter-flux-max").change(function () { self.datatable_flux.draw(); });
            $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
                if (settings.nTable == self.table_element_flux) {
                    const min = parseFloat($(where).find(".filter-flux-min").val());
                    const max = parseFloat($(where).find(".filter-flux-max").val());
                    const d = self.datatable_flux.data()[dataIndex];
                    // Check flux values
                    if (!isNaN(min) && d[1] < min) {
                        return false;
                    }
                    if (!isNaN(max) && d[1] > max) {
                        return false;
                    }
                    return true;
                }
                return true;
            });
            where.getElementsByClassName("cyano-regex")[0].addEventListener("click", function () {
                self.datatable_flux.search(self.datatable_flux.search(), $(this).prop("checked"), true).draw();
            });
            /*
                    FIXME$("#visual_fba").on("click", "g.node", function() {
                        var idx = Metabolite.indexByName($(this).children("text").text());
                        if (!isDragging & idx > -1) {
                            showEditMetaboliteDialog(model.metabolites[idx]);
                        }
                    });
            
                    $("#visual_fba").on("click", "g.edge text", function() {
                        // remove flux value
                        var idx = Enzyme.indexByName($(this).text().replace(/ \(-?[0-9]+(\.[0-9]+)?\)$/, ""));
                        if (!isDragging & idx > -1) {
                            showEditEnzymeDialog(model.reactions[idx], false);
                        }
                    });
            
                    $("#visual_fba").on("mousedown", "g", function(event) {
                        isDragging = false;
                        $(this).data('page', {x: event.pageX, y: event.pageY})
                    });
                    $("#visual_fba").on("mousemove", "g", function(event) {
                        var p = $(this).data('page');
                        if (p !== undefined) {
                            if (Math.abs(p.x - event.pageX) > 4 ||
                                Math.abs(p.y - event.pageY) > 4) {
                                isDragging = true;
                            }
                        }
                    });
            
                    $("#filter-flux-min").change(function() { datatable_flux.draw(); });
                    $("#filter-flux-max").change(function() { datatable_flux.draw(); });
            */
        }
        init() {
        }
        updateLabels() {
            if (this.simulation_chart == null) {
                return;
            }
            this.simulation_chart.axis.labels({
                x: $("#mba-x-label").val(),
                y: $("#mba-y-label").val(),
                y2: $("#mba-y2-label").val()
            });
        }
        ;
        notifyInfo(text) {
            document.getElementById("wedesign-notify-box").innerHTML = '<div class="alert alert-info" role="alert">\
            <span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>\
            <span class="sr-only">Info:</span>' + text + '</div>';
        }
        notifyWarning(text) {
            document.getElementById("wedesign-notify-box").innerHTML = '<div class="alert alert-warning" role="alert">\
            <span class="glyphicon glyphicon-warning-sign" aria-hidden="true"></span>\
            <span class="sr-only">Info:</span>' + text + '</div>';
        }
        notifyError(text) {
            document.getElementById("wedesign-notify-box").innerHTML = '<div class="alert alert-danger" role="alert">\
            <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>\
            <span class="sr-only">Error:</span>' + text + '</div>';
        }
        simulate() {
            let symtype = this.app.settings_page.getSimulationType();
            this.last_sim_type = symtype;
            this.last_sim_objective = this.app.model.reaction.get("id", this.app.settings_page.getObjective());
            if (symtype == "fba") {
                this.app.viz.renderSVGElement(this.createGraph(this.app.reaction_page.flux), {
                    engine: "dot"
                }).then((graph) => {
                    this.visual_fba_element.innerHTML = "";
                    this.visual_fba_element.appendChild(graph);
                    $(this.visual_fba_element).attr("width", "100%").attr("height", "400px");
                    let svgPan = svgPanZoom('.visual-fba > svg', { minZoom: 0.1, fit: false });
                    svgPan.zoom(1);
                });
                $(this.visual_graph_element).hide();
                $(this.visual_fba_element).show();
                $(this.export_button_graph).show();
                $(this.export_button_chart).hide();
                this.datatable_flux.clear();
                for (const reac of this.app.model.reactions) {
                    this.datatable_flux.row.add([reac.get_name_or_id(), this.app.reaction_page.flux[reac.id]]);
                }
                this.datatable_flux.draw();
                /*$("svg").find(".edge text").each(function() {
                        if ($(this).text().indexOf(cyano_design_objective_select.val() + " ") == 0) {
                            var new_x = ($("svg").width() / 2) - $(this).attr("x");
                            var new_y = ($("svg").height() / 2) - $(this).attr("y");
                            svgPan.pan({x: new_x, y: new_y});
                        }
                    });*/
            }
            else if (symtype == "mba") {
                $(this.visual_graph_element).show();
                $(this.visual_fba_element).hide();
                $(this.export_button_graph).hide();
                $(this.export_button_chart).show();
                this.design_fba();
            }
            else if (symtype == "sa") {
                $(this.visual_graph_element).show();
                $(this.visual_fba_element).hide();
                $(this.export_button_graph).hide();
                $(this.export_button_chart).show();
                this.target_fba();
            }
        }
        solve() {
            if (this.app.settings_page.getObjective() == "") {
                return;
            }
            const solutions = [
                "Undefined",
                "Feasible",
                "Infeasible",
                "Not feasible",
                "Optimal",
                "Unbound"
            ];
            this.app.glpk_worker.onerror = (err) => {
                console.log(err);
            };
            this.app.glpk_worker.onmessage = (evt) => {
                if (evt.data.initialized == true) {
                    // ignore init message
                    return;
                }
                this.app.reaction_page.flux = {};
                const vars = evt.data.result.vars;
                for (const key in vars) {
                    this.app.reaction_page.flux[key] = vars[key];
                }
                this.app.reaction_page.datatable.rows().invalidate();
                const fn = evt.data.result.status == 5 ? this.app.simulation_page.notifyInfo : this.app.simulation_page.notifyWarning;
                fn("The solution is " + solutions[evt.data.result.status - 1] + ". Flux of objective is " +
                    evt.data.result.z.toFixed(4));
            };
            this.app.model.fba(this.app.glpk_worker, this.app.model.reaction.get("id", this.app.settings_page.getObjective()), this.app.settings_page.maximizeObjective(), this.app.settings_page.getCreateExchangeReactions());
        }
        design_fba() {
            const obj = this.app.model.reaction.get("id", this.app.settings_page.getObjective());
            const design_obj = this.app.model.reaction.get("id", this.app.settings_page.getDesignObjective());
            const obj_copy = Object.assign({}, obj);
            let all_flux = [];
            let units = [];
            this.app.glpk_worker.onerror = (err) => {
                console.log(err);
            };
            const chart_clicked = (d) => {
                const solutions = [
                    "Undefined",
                    "Feasible",
                    "Infeasible",
                    "Not feasible",
                    "Optimal",
                    "Unbound"
                ];
                this.app.glpk_worker.onmessage = (evt) => {
                    obj.lower_bound = obj_copy.lower_bound;
                    obj.upper_bound = obj_copy.upper_bound;
                    this.app.reaction_page.flux = {};
                    const vars = evt.data.result.vars;
                    for (const key in vars) {
                        this.app.reaction_page.flux[key] = vars[key];
                    }
                    this.app.reaction_page.datatable.rows().invalidate();
                    const fn = evt.data.result.status == 5 ? this.app.simulation_page.notifyInfo : this.app.simulation_page.notifyWarning;
                    fn("The solution is " + solutions[evt.data.result.status - 1] + ". Flux of objective is " +
                        evt.data.result.z.toFixed(4));
                    // create FBA graph
                    this.app.viz.renderSVGElement(this.createGraph(this.app.reaction_page.flux), {
                        engine: "dot"
                    }).then((graph) => {
                        this.visual_fba_element.innerHTML = "";
                        this.visual_fba_element.appendChild(graph);
                        $(this.visual_fba_element).attr("width", "100%").attr("height", "400px");
                        let svgPan = svgPanZoom('.visual-fba > svg', { minZoom: 0.1, fit: false });
                        svgPan.zoom(1);
                    });
                    $(this.visual_fba_element).show();
                    $(this.export_button_graph).show();
                    this.visual_fba_element.innerHTML = graph;
                    this.datatable_flux.clear();
                    for (const reac of this.app.model.reactions) {
                        this.datatable_flux.row.add([reac.get_name_or_id(), this.app.reaction_page.flux[reac.id]]);
                    }
                    this.datatable_flux.draw();
                };
                const constraint = this.simulation_chart.categories()[d.index];
                obj.lower_bound = constraint;
                obj.upper_bound = constraint;
                this.app.model.fba(this.app.glpk_worker, design_obj, this.app.settings_page.maximizeObjective(), this.app.settings_page.getCreateExchangeReactions());
            };
            // Determine max and min of obj by constraining obj from 0 to nothing
            this.app.glpk_worker.onmessage = (evt) => {
                const max_flux = evt.data.result.z;
                for (let i = 0; i < 9; ++i) {
                    units.push((max_flux * (i / 9)) /*.toFixed(2)*/);
                }
                units.push(max_flux);
                const simulate_fn = () => {
                    if (units.length == 0) {
                        // Done, restore defaults
                        obj.lower_bound = obj_copy.lower_bound;
                        obj.upper_bound = obj_copy.upper_bound;
                        // Render chart
                        $(this.visual_graph_element).show();
                        $(this.visual_fba_element).hide();
                        let graph = [['x'], []];
                        graph[1].push(design_obj.get_name_or_id());
                        for (const fluxes of all_flux) {
                            graph[0].push(fluxes[0]);
                            graph[1].push(fluxes[1]);
                        }
                        if (!$("#remember-simulation").prop("checked") || this.simulation_chart === undefined) {
                            let chart = {
                                bindto: ".visual-graph",
                                data: {
                                    x: 'x',
                                    columns: graph,
                                    type: 'bar',
                                    axes: {},
                                    onclick: chart_clicked
                                },
                                axis: {
                                    x: {
                                        label: {
                                            position: "outer-center"
                                        },
                                        type: 'category'
                                    },
                                    y: {
                                        label: {
                                            position: "outer-middle"
                                        }
                                    }
                                }
                            };
                            chart["data"]["axes"][obj.get_name_or_id()] = "y";
                            this.simulation_chart = c3.generate(chart);
                        }
                        else {
                            this.simulation_chart.load({
                                columns: [
                                //FIXME[cyano_design_design_objective_select.val()].concat(simulation_result["graph"][1])
                                ],
                                type: 'bar'
                            });
                        }
                        //this.last_sim_flux = flux;
                        this.updateLabels();
                        return;
                    }
                    const unit = units[0];
                    units.splice(0, 1);
                    obj.lower_bound = unit;
                    obj.upper_bound = unit;
                    this.app.glpk_worker.onmessage = (evt) => {
                        all_flux.push([unit, evt.data.result.z]);
                        simulate_fn();
                    };
                    this.app.model.fba(this.app.glpk_worker, design_obj, this.app.settings_page.maximizeObjective(), this.app.settings_page.getCreateExchangeReactions());
                };
                simulate_fn();
            };
            this.app.model.fba(this.app.glpk_worker, obj, this.app.settings_page.maximizeObjective(), this.app.settings_page.getCreateExchangeReactions());
        }
        target_fba() {
            const obj = this.app.model.reaction.get("id", this.app.settings_page.getObjective());
            const design_obj = this.app.model.reaction.get("id", this.app.settings_page.getDesignObjective());
            const target_obj = this.app.model.reaction.get("id", this.app.settings_page.getTargetObjective());
            const obj_copy = Object.assign({}, obj);
            const target_copy = Object.assign({}, target_obj);
            let design_result;
            const chart_clicked = (d) => {
                const solutions = [
                    "Undefined",
                    "Feasible",
                    "Infeasible",
                    "Not feasible",
                    "Optimal",
                    "Unbound"
                ];
                this.app.glpk_worker.onmessage = (evt) => {
                    obj.lower_bound = obj_copy.lower_bound;
                    obj.upper_bound = obj_copy.upper_bound;
                    target_obj.lower_bound = target_copy.lower_bound;
                    target_obj.upper_bound = target_copy.upper_bound;
                    this.app.reaction_page.flux = {};
                    const vars = evt.data.result.vars;
                    for (const key in vars) {
                        this.app.reaction_page.flux[key] = vars[key];
                    }
                    this.app.reaction_page.datatable.rows().invalidate();
                    const fn = evt.data.result.status == 5 ? this.app.simulation_page.notifyInfo : this.app.simulation_page.notifyWarning;
                    fn("The solution is " + solutions[evt.data.result.status - 1] + ". Flux of objective is " +
                        evt.data.result.z.toFixed(4));
                    // create FBA graph
                    this.app.viz.renderSVGElement(this.createGraph(this.app.reaction_page.flux), {
                        engine: "dot"
                    }).then((graph) => {
                        this.visual_fba_element.innerHTML = "";
                        this.visual_fba_element.appendChild(graph);
                        $(this.visual_fba_element).attr("width", "100%").attr("height", "400px");
                        let svgPan = svgPanZoom('.visual-fba > svg', { minZoom: 0.1, fit: false });
                        svgPan.zoom(1);
                    });
                    $(this.visual_fba_element).show();
                    this.datatable_flux.clear();
                    for (const reac of this.app.model.reactions) {
                        this.datatable_flux.row.add([reac.get_name_or_id(), this.app.reaction_page.flux[reac.id]]);
                    }
                    this.datatable_flux.draw();
                };
                const constraint = this.simulation_chart.data()[0]["values"][d.index].value;
                obj.lower_bound = constraint;
                obj.upper_bound = constraint;
                target_obj.upper_bound = this.last_target_obj_results[d.index];
                this.app.model.fba(this.app.glpk_worker, design_obj, this.app.settings_page.maximizeObjective(), this.app.settings_page.getCreateExchangeReactions());
            };
            this.app.glpk_worker.onerror = (err) => {
                console.log(err);
            };
            this.app.glpk_worker.onmessage = (evt) => {
                let target_flux = 0.0;
                const vars = evt.data.result.vars;
                for (const key in vars) {
                    if (key == target_obj.id) {
                        target_flux = vars[key];
                        break;
                    }
                }
                design_result = [["x"], [obj.id], [design_obj.id], ["Yield"]];
                let perc = [1.0, 0.8, 0.6, 0.4, 0.2, 0.0];
                //let dflux: any[] = [];
                const simulate_fn = () => {
                    if (perc.length == 0) {
                        // Done, restore defaults
                        obj.lower_bound = obj_copy.lower_bound;
                        obj.upper_bound = obj_copy.upper_bound;
                        target_obj.lower_bound = target_copy.lower_bound;
                        target_obj.upper_bound = target_copy.upper_bound;
                        // Render chart
                        $(this.visual_graph_element).show();
                        $(this.visual_fba_element).hide();
                        if (!$("#remember-simulation").prop("checked") || this.simulation_chart === undefined) {
                            let chart = {
                                bindto: ".visual-graph",
                                data: {
                                    x: 'x',
                                    columns: design_result,
                                    type: 'bar',
                                    axes: {},
                                    onclick: chart_clicked
                                },
                                axis: {
                                    x: {
                                        label: {
                                            position: "outer-center"
                                        },
                                        type: 'category'
                                    },
                                    y: {
                                        label: {
                                            position: "outer-middle"
                                        }
                                    },
                                    y2: {
                                        label: {
                                            position: "outer-middle"
                                        },
                                        show: true
                                    }
                                }
                            };
                            chart["data"]["axes"][obj.get_name_or_id()] = "y";
                            chart["data"]["axes"][design_obj.get_name_or_id()] = "y2";
                            this.simulation_chart = c3.generate(chart);
                        }
                        else {
                            this.simulation_chart.load({
                                columns: [
                                //FIXME[cyano_design_design_objective_select.val()].concat(simulation_result["graph"][1])
                                ],
                                type: 'bar'
                            });
                        }
                        //this.last_sim_flux = flux;
                        this.updateLabels();
                        return;
                    }
                    // Limit to a % of the target flux
                    const unit = perc[0] * target_flux;
                    const per = perc[0];
                    perc.splice(0, 1);
                    target_obj.upper_bound = unit;
                    this.last_target_obj_results.push(unit);
                    // Optimize limited growth
                    this.app.glpk_worker.onmessage = (evt) => {
                        const growth = evt.data.result.z;
                        // Optimize production
                        obj.lower_bound = growth;
                        obj.upper_bound = growth;
                        this.app.glpk_worker.onmessage = (evt) => {
                            const production = evt.data.result.z;
                            // Reset production constraint
                            obj.lower_bound = 0;
                            obj.upper_bound = 100000;
                            design_result[0].push((per * 100) + "%");
                            design_result[1].push(growth);
                            design_result[2].push(production);
                            design_result[3].push(growth * production);
                            /*let f: any = {};
                            dflux.push(f);
    
                            const vars = evt.data.result.vars;
                            for (const key in vars) {
                                f[key] = vars[key];
                            }*/
                            simulate_fn();
                        };
                        this.app.model.fba(this.app.glpk_worker, design_obj, this.app.settings_page.maximizeObjective(), this.app.settings_page.getCreateExchangeReactions());
                    };
                    this.app.model.fba(this.app.glpk_worker, obj, this.app.settings_page.maximizeObjective(), this.app.settings_page.getCreateExchangeReactions());
                };
                this.last_target_obj_results = [];
                simulate_fn();
            };
            this.app.model.fba(this.app.glpk_worker, obj, this.app.settings_page.maximizeObjective(), this.app.settings_page.getCreateExchangeReactions());
        }
        createCsv() {
            const data = this.simulation_chart.data();
            let csv = "x;" + data.map((x) => x["id"]).join(";") + "\n";
            for (let i = 0; i < data[0]["values"].length; ++i) {
                for (let j = 0; j < data.length; ++j) {
                    if (j == 0) {
                        csv += data[j]["values"][i]["x"] + ";";
                    }
                    csv += data[j]["values"][i]["value"];
                    if (j != data.length - 1) {
                        csv += ";";
                    }
                }
                csv += "\n";
            }
            return csv;
        }
        createGraph(flux) {
            // the ugly indent is intentional because template strings preserve leading whitespace
            let graph = `strict digraph {
graph [overlap=False, rankdir=LR, splines=True];
node [colorscheme=pastel19, label="\\N", style=filled];
`;
            const reac_offset = this.app.model.metabolites.length;
            // Create sparse array
            let edges = [];
            // A_ext -> A
            let i = 0;
            for (const met of this.app.model.metabolites) {
                const color = (i % 9) + 1;
                graph += `${i} [
    color=${color},
    label="${met.name}",
    shape=oval
];
`;
                ++i;
            }
            // Pen scaling factor calculation
            let max_flux = Number.MIN_SAFE_INTEGER;
            for (const f in flux) {
                max_flux = Math.max(flux[f] < 0.0 ? -flux[f] : flux[f], max_flux);
            }
            max_flux = 10 / max_flux;
            const obj = this.app.settings_page.getObjective();
            for (const reac of this.app.model.reactions) {
                for (const p of reac.products) {
                    for (const s of reac.substrates) {
                        let f = flux[reac.id];
                        const flux_norm = Math.abs(f) * max_flux;
                        edges.push({
                            label: reac.name,
                            flux: f.toFixed(2),
                            color: f < 0.0 ? "red" : f > 0.0 ? "green" : "black",
                            penwidth: (flux_norm - 1.0 < 1.0) ? 1 : flux_norm,
                            left: this.app.model.metabolite.index("id", s.id),
                            right: this.app.model.metabolite.index("id", p.id),
                            reverse: reac.reversible,
                            style: reac.id == obj ? "dashed" : "solid"
                        });
                    }
                }
            }
            i = reac_offset;
            for (const edge of edges) {
                graph += `${edge.left} -> ${edge.right} [
    color=${edge.color},
    label="${edge.label} (${edge.flux})",
    penwidth=${edge.penwidth},
    style=${edge.style},
];
`;
                if (edge.reverse) {
                    graph += `${edge.left} -> ${edge.right} [
    label="${edge.label}",
]
`;
                }
                ++i;
            }
            graph += '}\n';
            this.last_dot_graph = graph;
            return graph;
        }
    }
    exports.Page = Page;
});