export declare namespace Internal {
    class ClassBuilder {
        private typeObj;
        constructor(typeObj: any);
        create(): any;
    }
    class LstOp<T extends ElementBase> {
        readonly lst: T[];
        readonly type: any;
        constructor(list: T[], type: any);
        get(key: string, value: any): T | null;
        checked_get(key: string, value: any): T;
        has(key: string, value: any): boolean;
        index(key: string, value: any): number | null;
        checked_index(key: string, value: any): number;
        add(item: T): void;
        remove(key: string, value: any): boolean;
        create(): T;
    }
}
declare abstract class ElementBase {
    [key: string]: any;
    id: string;
    metaid: string;
    name: string;
    sbo_term: string;
    description: string;
    abstract fromJson(j: any): void;
    read_common_attribute(k: string, v: any): void;
    read_list<T extends ElementBase>(src_list: any, dst_list: T[], creator: Internal.ClassBuilder): void;
    get_name_or_id(): string;
    fixup(): void;
}
export declare class Model extends ElementBase {
    metabolites: Metabolite[];
    reactions: Reaction[];
    compartments: Compartment[];
    parameters: Parameter[];
    objectives: Objective[];
    external_compartment: Compartment;
    lower_bound_limit: number;
    upper_bound_limit: number;
    readonly metabolite: Internal.LstOp<Metabolite>;
    readonly reaction: Internal.LstOp<Reaction>;
    readonly compartment: Internal.LstOp<Compartment>;
    readonly parameter: Internal.LstOp<Parameter>;
    readonly objective: Internal.LstOp<Objective>;
    readAttributes(attrs: object): void;
    fromJson(j: any): void;
    getExternalMetabolites(): Metabolite[];
    refreshConstraints(): void;
    getDefaultCompartment(): Compartment;
    refreshExternalCompartment(): Compartment;
    getExternalCompartment(): Compartment;
    fba(glpk_worker: Worker, obj: Reaction, maximize: boolean, create_exchange_reactions?: boolean): void;
}
export declare class Compartment extends ElementBase {
    constant: boolean;
    units: string;
    updateId(new_id: string, model: Model): void;
    readAttributes(attrs: any): void;
    fromJson(j: any): void;
}
export declare class Reaction extends ElementBase {
    lower_bound: number | null;
    upper_bound: number | null;
    lower_bound_name: string;
    upper_bound_name: string;
    reversible: boolean;
    fast: boolean;
    substrates: MetaboliteReference[];
    products: MetaboliteReference[];
    enabled: boolean;
    static fromBioOptString(bioopt_string: string, model: Model): Reaction;
    static nameComparator(a: Reaction, b: Reaction): number;
    readAttributes(attrs: any): void;
    fromJson(j: any): void;
    fixup(): void;
    isConstrained(model: Model): boolean;
    makeUnconstrained(model: Model): void;
    updateId(new_id: string, model: Model): void;
    toHtml(model: Model): HTMLDivElement;
    reactionToString(model: Model): string;
    toString(model: Model): string;
    constraintsToString(model: Model): string;
    clearMetaboliteReference(model: Model): Metabolite[];
    updateMetaboliteReference(model: Model): Metabolite[];
    remove(model: Model): boolean;
    getMetaboliteIds(model: Model): string[];
    getMetabolites(model: Model): Metabolite[];
}
export declare class MetaboliteReference extends ElementBase {
    constant: boolean;
    stoichiometry: number;
    readAttributes(attrs: any): void;
    fromJson(j: any): void;
    getMetabolite(model: Model, ignore_errors?: boolean): Metabolite;
    toHtml(model: Model): HTMLSpanElement;
    toString(): string;
}
export declare class Metabolite extends ElementBase {
    compartment: string;
    charge: number;
    formula: string;
    constant: boolean;
    boundary_condition: boolean;
    has_only_substance_units: boolean;
    produced: Reaction[];
    consumed: Reaction[];
    readAttributes(attrs: any): void;
    fromJson(j: any): void;
    updateId(new_id: string, model: Model): void;
    remove(model: Model): boolean;
    isUnused(): boolean;
    getReactions(): Reaction[];
    isExternal(model: Model): boolean;
}
export declare class Parameter extends ElementBase {
    constant: boolean;
    units: string;
    value: number;
    readAttributes(attrs: any): void;
    fromJson(j: any): void;
}
export declare class Objective extends ElementBase {
    type: string;
    flux_objectives: FluxObjective[];
    readonly flux_objective: Internal.LstOp<ElementBase>;
    readAttributes(attrs: any): void;
    fromJson(j: any): void;
}
export declare class FluxObjective extends ElementBase {
    coefficient: number;
    reaction: string;
    readAttributes(attrs: any): void;
    fromJson(j: any): void;
}
export {};
