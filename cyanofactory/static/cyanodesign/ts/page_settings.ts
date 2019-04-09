import * as app from "./app"
import * as mm from "./metabolic_model";
import * as $ from "jquery";
import "datatables.net";

let template = document.createElement('template');
template.innerHTML = `
<div class="cyano-design-objective">
    <fieldset>
        <div class="form-group">
            <label class="control-label" for="cyano-design-objective-select">Main objective</label>
            <select class="cyano-design-objective-select" placeholder="Select a main objective"></select>
        </div>

       <div class="radio">
            <input type="radio" name="maxmingroup" class="radio-maximize" value="maximize-obj">
            <label for="radio-maximize">
                Maximize objective
            </label>
        </div>
        <div class="radio">
            <input type="radio" name="maxmingroup" class="radio-minimize" value="minimize-obj">
            <label for="radio-minimize">
                Minimize objective
            </label>
        </div>
    </fieldset>
</div>

<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">Simulation Type</h3>
    </div>
    <div class="panel-body" class="simulation-type">
        <div class="radio">
            <input type="radio" name="simulationtype" class="radio-fba">
            <label for="radio-fba">
                Flux Balance Analysis
            </label>
        </div>
        <div class="radio">
            <input type="radio" name="simulationtype" class="radio-mba">
            <label for="radio-mba">
                Robustness Analysis
            </label>
        </div>
        <div class="radio">
            <input type="radio" name="simulationtype" class="radio-sa">
            <label for="radio-sa">
                Sensitivity Analysis
            </label>
        </div>
    </div>
</div>

<div class="panel panel-default" class="fba-settings-panel">
    <div class="panel-heading">
        <h3 class="panel-title">FBA settings</h3>
    </div>

    <div class="panel-body" class="settings-fba">
        <div>
            The main objective is always displayed in the simulation.
        </div>

        <div>
            <div class="radio">
                <input class="auto_flux" type="radio" name="flux" value="auto_flux">
                <label for="auto_flux">Display reactions with highest flux connected to the objective</label>
            </div>
            <div class="radio">
                <input class="manual_flux" type="radio" name="flux" value="manual_flux">
                <label for="manual_flux">Display selected reactions</label>
            </div>
        </div>

        <div class="cyano-design-reaction-filter">
            <fieldset>
                <div class="form-group">
                    <label class="control-label" for="design-objective-visible-combobox">Select visible reactions</label>
                    <input class="design-objective-visible-combobox">
                </div>
            </fieldset>
        </div>
    </div>
</div>

<div class="panel panel-default" class="sa-settings-panel">
    <div class="panel-heading">
        <h3 class="panel-title">Sensitivity/RA settings</h3>
    </div>

    <div class="panel-body" class="settings-mba">
        <fieldset>
            <div class="form-group">
                <label class="control-label" for="cyano-design-design-objective-select">Design objective</label>
                <select class="cyano-design-design-objective-select" placeholder="Select a design objective"></select>
            </div>
            <div class="form-group" class="sa-settings-target-function-panel">
                <label class="control-label" for="cyano-design-target-objective-select">Target reaction</label>
                <select class="cyano-design-target-objective-select" placeholder="Select a target reaction"></select>
            </div>
        </fieldset>
    </div>
</div>

<div class="panel panel-default" class="sa-settings-axis-panel">
    <div class="panel-heading">
        <h3 class="panel-title">Axis label</h3>
    </div>

    <div class="panel-body">
        <fieldset>
            <label class="control-label" for="mba-x-label">X-Axis</label>
            <input class="form-control" type="text" class="mba-x-label">
            <label class="control-label" for="mba-y-label">Y-Axis (Left)</label>
            <input class="form-control" type="text" class="mba-y-label">
            <label class="control-label" for="mba-y2-label">Y-Axis (Right)</label>
            <input class="form-control" type="text" class="mba-y2-label">
            Changes apply without running a new simulation
        </fieldset>
    </div>
</div>

`;

export class Page {
    readonly app: app.AppManager;
    readonly source_element: HTMLElement;
    readonly main_obj_element: HTMLElement;
    readonly maximize_element: HTMLElement;
    readonly fba_sim_element: HTMLElement;

    constructor(where: HTMLElement, app: app.AppManager) {
        this.app = app;
        this.source_element = where;
        where.appendChild(template.content.cloneNode(true));

        this.main_obj_element = <HTMLElement>where.getElementsByClassName("cyano-design-objective-select")[0]!;
        this.maximize_element = <HTMLElement>where.getElementsByClassName("radio-maximize")[0]!;
        this.fba_sim_element = <HTMLElement>where.getElementsByClassName("radio-fba")[0]!;

        $(this.maximize_element).prop("checked", true);
        $(this.fba_sim_element).prop("checked", true);
    }

    update() {
        $(this.main_obj_element)["selectize"]({
            maxItems: 1,
            valueField: 'id',
            searchField: ['name', 'id'],
            options: this.app.model.reactions,
            render: {
                item: function(item: mm.Reaction, escape: any) {
                    return "<div>" + escape(item.get_name_or_id()) + "</div>";
                },
                option: function(item: mm.Reaction, escape: any) {
                    return "<div>" + escape(item.get_name_or_id()) + "</div>";
                }
            }
        });
    }

    getObjective(): mm.Reaction | null {
        return this.app.model.reaction.checked_get("id", this.main_obj_element["selectize"].getValue());
    }

    maximizeObjective(): boolean {
        return $(this.maximize_element).prop("checked");
    }

    getSimulationType(): string {
        if ($(this.fba_sim_element).prop("checked")) {
            return "fba";
        } else if ($(<HTMLElement>this.source_element.getElementsByClassName("radio-mba")[0]!).prop("checked")) {
            return "mba";
        } else {
            return "ra";
        }
    }

    getFbaSettings(): { highest_flux: boolean, selection: mm.Reaction[] | null } {
        return {
            highest_flux: true,
            selection: null
        }
    }

    getMbaSettings(): { design_obj: mm.Reaction | null, target_reaction: mm.Reaction | null } {
        return {
            design_obj: null,
            target_reaction: null
        }
    }

    getAxisLabels(): { x: string; y_left: string; y_right: string} {
        return {
            x: "",
            y_left: "",
            y_right: ""
        }
    }
}
