import * as app from "./app";
import "datatables.net";
export declare class Page {
    readonly app: app.AppManager;
    readonly datatable: DataTables.Api;
    readonly source_element: HTMLElement;
    readonly table_element: HTMLElement;
    constructor(where: HTMLElement, app: app.AppManager);
    init(): void;
}
