import "selectize";
export declare class DialogHelper {
    static updateTips(o: HTMLElement, txt: string): void;
    static checkLength(o: HTMLElement, n: string, min: number, max: number): boolean;
    static checkBool(o: HTMLElement, bool: boolean, error: string): boolean;
    static checkRegexpPos(o: HTMLElement, regexp: RegExp, n: any): boolean;
    static checkRegexp(o: HTMLElement, regexp: RegExp, n: any): boolean;
    static checkId(o: HTMLElement): boolean;
    static getFloat(value: string): number;
}
export declare class ElementWrapper<T> {
    private readonly html_element;
    private readonly type;
    static byClass<T>(classname: string, parent: HTMLElement): ElementWrapper<T>;
    constructor(element: HTMLInputElement);
    value: T;
    readonly element: HTMLElement;
}
