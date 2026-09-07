export type RuleCategory = "architecture" | "boundaries" | "core" | "strict" | "testing" | "type-safety";
export type RuleOrigin = "dak.dev-2026" | "itstechnight-web" | "openfactory";
export type RuleMetadata = {
    readonly category: RuleCategory;
    readonly origins: readonly RuleOrigin[];
};
export declare const sourceRevisions: {
    "dak.dev-2026": string;
    "itstechnight-web": string;
    openfactory: string;
};
export declare const ruleCatalog: {
    "extensionless-relative-code-imports": {
        category: "strict";
        origins: "openfactory"[];
    };
    "no-chained-type-assertions": {
        category: "type-safety";
        origins: "itstechnight-web"[];
    };
    "no-conditional-empty-object-spread": {
        category: "core";
        origins: "itstechnight-web"[];
    };
    "no-exported-types": {
        category: "architecture";
        origins: "dak.dev-2026"[];
    };
    "no-generic-record-guard": {
        category: "boundaries";
        origins: ("dak.dev-2026" | "openfactory")[];
    };
    "no-known-value-widening": {
        category: "type-safety";
        origins: "itstechnight-web"[];
    };
    "no-module-mocking": {
        category: "testing";
        origins: "itstechnight-web"[];
    };
    "no-object-parameters": {
        category: "type-safety";
        origins: "itstechnight-web"[];
    };
    "no-reflect-apply": {
        category: "boundaries";
        origins: "itstechnight-web"[];
    };
    "no-reflect-get": {
        category: "boundaries";
        origins: "itstechnight-web"[];
    };
    "no-runtime-typeof": {
        category: "boundaries";
        origins: "itstechnight-web"[];
    };
    "no-shape-in-symbol-names": {
        category: "core";
        origins: "itstechnight-web"[];
    };
    "no-type-assertions": {
        category: "strict";
        origins: "itstechnight-web"[];
    };
    "no-unjustified-type-predicate": {
        category: "boundaries";
        origins: "openfactory"[];
    };
    "no-unknown-parameters": {
        category: "type-safety";
        origins: "itstechnight-web"[];
    };
    "no-unknown-returns": {
        category: "type-safety";
        origins: "itstechnight-web"[];
    };
    "no-unknown-type-aliases": {
        category: "type-safety";
        origins: "itstechnight-web"[];
    };
    "no-unsafe-dictionary-type": {
        category: "type-safety";
        origins: "itstechnight-web"[];
    };
    "no-widen-then-assert": {
        category: "type-safety";
        origins: "itstechnight-web"[];
    };
    "padding-line-between-statements": {
        category: "core";
        origins: "dak.dev-2026"[];
    };
    "require-safety-comment-for-type-assertion": {
        category: "type-safety";
        origins: "itstechnight-web"[];
    };
};
//# sourceMappingURL=catalog.d.ts.map