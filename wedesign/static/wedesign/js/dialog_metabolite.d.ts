import * as app from "./app";
import * as mm from "./metabolic_model";
import { ElementWrapper } from "./dialog_helper";
import "datatables.net";
export declare class Dialog {
    readonly app: app.AppManager;
    readonly datatable: DataTables.Api;
    readonly dialog_element: HTMLElement;
    item: mm.Metabolite;
    create: boolean;
    readonly id: ElementWrapper<string>;
    readonly name: ElementWrapper<string>;
    readonly compartment: ElementWrapper<string>;
    readonly formula: ElementWrapper<string>;
    constructor(app: app.AppManager);
    show(metabolite?: mm.Metabolite): void;
    validate(): boolean;
}
