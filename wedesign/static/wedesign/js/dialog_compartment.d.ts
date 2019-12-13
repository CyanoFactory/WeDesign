import * as app from "./app";
import * as mm from "./metabolic_model";
import { ElementWrapper } from "./dialog_helper";
import "datatables.net";
export declare class Dialog {
    readonly app: app.AppManager;
    readonly datatable: DataTables.Api;
    readonly dialog_element: HTMLElement;
    item: mm.Compartment;
    create: boolean;
    readonly id: ElementWrapper<string>;
    readonly name: ElementWrapper<string>;
    constructor(app: app.AppManager);
    show(compartment?: mm.Compartment): void;
    validate(): boolean;
}
