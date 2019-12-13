import * as app from "./app";
import * as mm from "./metabolic_model";
import "datatables.net";
export declare class Page {
    readonly app: app.AppManager;
    readonly datatable: DataTables.Api;
    readonly source_element: HTMLElement;
    readonly table_element: HTMLElement;
    flux: any;
    constructor(where: HTMLElement, app: app.AppManager);
    init(): void;
    refresh(): void;
    invalidate(reaction: mm.Reaction): void;
}
