/*
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
*/
define(["require", "exports", "jquery", "./page_reactions", "./page_metabolites", "./page_compartments", "./page_settings", "./page_simulation", "./page_history", "./dialog_reaction", "./dialog_reaction_bulkadd", "./dialog_reaction_delete", "./dialog_metabolite", "./dialog_save", "./dialog_saveas", "./dialog_compartment", "./request_handler", "./history_manager"], function (require, exports, $, reactions, metabolites, compartments, settings, simulation, history, dialog_reaction, dialog_reaction_bulkadd, dialog_reaction_delete, dialog_metabolite, dialog_save, dialog_saveas, dialog_compartment, request_handler_1, history_manager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AppManager {
        constructor(mm_cls, urls, glpk_worker, viz) {
            this.glpk_worker_is_ready = false;
            this.history_manager = null;
            glpk_worker.onmessage = (evt) => {
                this.glpk_worker_is_ready = true;
            };
            this.model = new mm_cls.Model();
            this.urls = urls;
            this.request_handler = new request_handler_1.RequestHandler(this, -1);
            this.glpk_worker = glpk_worker;
            this.viz = viz;
            this.history_manager = new history_manager_1.HistoryManager(this);
            this.dialog_reaction = new dialog_reaction.Dialog(this);
            this.dialog_reaction_bulk = new dialog_reaction_bulkadd.Dialog(this);
            this.dialog_reaction_delete = new dialog_reaction_delete.Dialog(this);
            this.dialog_metabolite = new dialog_metabolite.Dialog(this);
            this.dialog_save = new dialog_save.Dialog(this);
            this.dialog_saveas = new dialog_saveas.Dialog(this);
            this.dialog_compartment = new dialog_compartment.Dialog(this);
            this.reaction_page = new reactions.Page(document.getElementById("reaction-tab"), this);
            this.metabolite_page = new metabolites.Page(document.getElementById("metabolite-tab"), this);
            this.compartment_page = new compartments.Page(document.getElementById("compartment-tab"), this);
            //this.stoichiometry_page = new stoichiometry.Page(document.getElementById("chemical-tab")!, this);
            this.settings_page = new settings.Page(document.getElementById("settings-tab"), this);
            this.history_page = new history.Page(document.getElementById("history-tab"), this);
            this.simulation_page = new simulation.Page(document.getElementById("simulation-tab"), this);
        }
        assignModel(model_json) {
            this.model.fromJson(model_json);
            this.old_model = model_json;
        }
    }
    exports.AppManager = AppManager;
    function run(mm_cls, urls, glpk_worker, viz) {
        app = new AppManager(mm_cls, urls, glpk_worker, viz);
        $.ajax({
            url: urls.get_reactions,
            context: document.body
        }).done(function (model) {
            app.assignModel(model);
            $.ajax({
                url: urls.get_revisions,
            }).done((x) => app.history_page.init(x));
            app.reaction_page.init();
            app.metabolite_page.init();
            app.compartment_page.init();
            //app.stoichiometry_page.init();
            app.settings_page.init();
            app.simulation_page.init();
            $(".create-enzyme-button").on("click", function () {
                app.dialog_reaction.show(null);
            });
            $(".create-metabolite-button").on("click", function () {
                app.dialog_metabolite.show(null);
            });
            $(".create-enzyme-bulk-button").on("click", function () {
                app.dialog_reaction_bulk.show();
            });
            $("#design-save").on("click", function () {
                app.dialog_save.show();
            });
            app.simulation_page.solve();
            app.request_handler.endRequest($("#content"));
        });
    }
    exports.run = run;
});
