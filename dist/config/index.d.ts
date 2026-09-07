import type { OxlintConfig } from "oxlint";
export type PresetName = "all" | "architecture" | "boundaries" | "core" | "effect" | "react-next" | "recommended" | "strict" | "testing" | "type-aware" | "type-safety";
export type QualityConfig = Omit<OxlintConfig, "extends"> & {
    extends?: OxlintConfig[];
    presets?: readonly PresetName[];
};
/** Compose quality policy presets with repository-local Oxlint configuration. */
export declare function defineConfig(config?: QualityConfig): OxlintConfig;
export declare const presetNames: readonly PresetName[];
//# sourceMappingURL=index.d.ts.map