import * as app from "./app";
import * as mm from "./metabolic_model";
import { ElementWrapper } from "./dialog_helper";
import "datatables.net";
import "selectize";
export declare class Page {
    readonly app: app.AppManager;
    readonly source_element: HTMLElement;
    readonly main_obj: ElementWrapper<string>;
    readonly design_obj: ElementWrapper<string>;
    readonly target_obj: ElementWrapper<string>;
    readonly exchange_reaction: ElementWrapper<string>;
    readonly maximize: ElementWrapper<boolean>;
    readonly minimize: ElementWrapper<boolean>;
    readonly fba_sim: ElementWrapper<boolean>;
    readonly mba_sim: ElementWrapper<boolean>;
    readonly sa_sim: ElementWrapper<boolean>;
    private once;
    constructor(where: HTMLElement, app: app.AppManager);
    init(): void;
    refresh(reactions?: mm.Reaction[]): void;
    getObjective(): string;
    getDesignObjective(): string;
    getTargetObjective(): string;
    getCreateExchangeReactions(): boolean;
    maximizeObjective(): boolean;
    getSimulationType(): string;
    setSimulationType(t: string): void;
    getFbaSettings(): {
        highest_flux: boolean;
        selection: mm.Reaction[] | null;
    };
    getMbaSettings(): {
        design_obj: mm.Reaction | null;
        target_reaction: mm.Reaction | null;
    };
    getAxisLabels(): {
        x: string;
        y_left: string;
        y_right: string;
    };
    static updateSettingsVisibility(self: Page): void;
}
