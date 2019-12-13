import * as app from "./app";
export declare class RequestHandler {
    private readonly app;
    private readonly revision;
    constructor(app: app.AppManager, revision: number);
    beginRequest(show_on?: any): any;
    endRequest(hide_on?: any): void;
    simulate(): void;
    save(summary: string): void;
    saveas(summary: string, new_id: string): void;
}
