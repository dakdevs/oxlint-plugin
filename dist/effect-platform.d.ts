export type EffectOxlintTarget = {
    readonly architecture: string;
    readonly glibc: boolean;
    readonly platform: string;
};
export declare function currentEffectOxlintTarget(): EffectOxlintTarget;
export declare function effectOxlintSupportError(target: EffectOxlintTarget): string | null;
//# sourceMappingURL=effect-platform.d.ts.map