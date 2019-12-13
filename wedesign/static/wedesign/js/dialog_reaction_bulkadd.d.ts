import * as app from "./app";
import * as mm from "./metabolic_model";
import "datatables.net";
export declare class Dialog {
    app: app.AppManager;
    readonly datatable: DataTables.Api;
    readonly dialog_element: HTMLElement;
    readonly bulkdata_element: HTMLElement;
    readonly bulkdata_preview_element: HTMLElement;
    reactions: mm.Reaction[];
    constructor(app: app.AppManager);
    show(): void;
    validate(): boolean;
}
