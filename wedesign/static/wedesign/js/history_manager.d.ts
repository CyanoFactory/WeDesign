import * as app from "./app";
export declare class HistoryEntry {
    type: string;
    op: string;
    id: string;
    object: any;
    undo: boolean;
    group: HistoryGroup;
    constructor();
}
export declare class HistoryGroup {
    id: number;
    summary: string;
    date: string;
}
export declare class HistoryManager {
    history: HistoryEntry[];
    private readonly app;
    current_id: number;
    constructor(app: app.AppManager);
    push(entry: any, group?: HistoryGroup | null): void;
    op(idx: number): string;
    source(idx: number): string;
    parse(idx: number): string;
    apply(idx: number): void;
    undo(idx: number): void;
    redo(idx: number): void;
    current(): HistoryEntry[];
    clear(): void;
    refresh(): void;
}
