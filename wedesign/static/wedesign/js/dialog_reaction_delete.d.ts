import * as app from "./app";
import * as mm from "./metabolic_model";
import "datatables.net";
export declare class Dialog {
    readonly app: app.AppManager;
    readonly model: mm.Model;
    readonly dialog_element: HTMLElement;
    private item;
    constructor(app: app.AppManager);
    show(reaction: mm.Reaction): void;
    ok_clicked(): void;
}
