/*
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
*/

import * as app from "./app"
import * as mm from "./metabolic_model";
import * as $ from "jquery";
import {HistoryManager} from "./history_manager";

declare var waitIndicator: any;

export class RequestHandler {
    private readonly app: app.AppManager;
    private readonly revision: number;

    constructor(app: app.AppManager, revision: number) {
        this.app = app;
        this.revision = revision;
    }

    beginRequest(show_on: any = null): any {
        if (show_on == null)
            waitIndicator.show($("#content"));
        else
            waitIndicator.show(show_on);

        let result = {
            "changes": JSON.stringify(this.app.history_manager.current())
        };

        if (this.revision != -1) {
            result["revision"] = this.revision;
        }

        return result;
    }

    endRequest(hide_on: any = null): void {
        if (hide_on == null)
            waitIndicator.hide($("#content"));
        else
            waitIndicator.hide(hide_on);
    }

    simulate() {
        let data = this.beginRequest();
        const self: RequestHandler = this;

        $.ajax({
            url: this.app.urls.simulate,
            type: "POST",
            data: data
        }).done(function(x) {
            self.app.simulation_page.simulate(x);
            self.endRequest();
        }).fail(function(x) {
            //$("#visual_graph").hide();
            //$("#visual_fba").hide();
            self.app.simulation_page.notifyError(x.responseText);
            self.endRequest();
        });
    }

    save(summary: string) {
        let data = this.beginRequest();
        const self: RequestHandler = this;

        data["summary"] = summary;

        $.ajax({
            url: self.app.urls.save,
            type: "POST",
            data: data
        }).done((x: any) => {
            $.ajax({
                url: this.app.urls.get_revisions,
            }).done((x: any) => this.app.history_page.init(x));
            self.endRequest();
        }).fail(function(x) {
            self.endRequest();
        });
    }

    saveas(summary: string, new_id: string) {
        let form = $("#dialog-saveas-model").find("form");
        let data = this.beginRequest();
        data["saveas_name"] = new_id;
        data["saveas_summary"] = summary;
        const self: RequestHandler = this;
        $.ajax({
            url: this.app.urls.saveas,
            type: "POST",
            data: data
        }).done(function(x) {
            if (!(x['success'])) {
                form.replaceWith(x['form_html']);
            } else {
                location.replace(x['url'])
            }
            self.endRequest($("#dialog-saveas-model").find(".modal-content"));
        }).fail(function(x) {
            self.endRequest($("#dialog-saveas-model").find(".modal-content"));
        });
    }
}
