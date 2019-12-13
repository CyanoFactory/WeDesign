import * as app from "./app";
import * as mm from "./metabolic_model";
import { ElementWrapper } from "./dialog_helper";
import "datatables.net";
import "selectize";
export declare class Dialog {
    readonly app: app.AppManager;
    readonly datatable: DataTables.Api;
    readonly dialog_element: HTMLElement;
    item: mm.Reaction;
    create: boolean;
    readonly id: ElementWrapper<string>;
    readonly name: ElementWrapper<string>;
    readonly substrates: HTMLDivElement;
    readonly products: HTMLDivElement;
    readonly enabled: ElementWrapper<boolean>;
    readonly reversible: ElementWrapper<boolean>;
    readonly constrained: ElementWrapper<boolean>;
    readonly constrained_min: ElementWrapper<string>;
    readonly constrained_max: ElementWrapper<string>;
    readonly obj_options: any;
    constructor(app: app.AppManager);
    show(reaction: mm.Reaction): void;
    validate(): boolean;
    private addSubstrate;
    private addProduct;
}
