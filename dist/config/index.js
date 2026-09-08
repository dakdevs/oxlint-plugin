import { createRequire } from "node:module";
const qualityPlugin = {
    name: "quality",
    specifier: "@dakdevs/oxlint-plugin",
};
const coreConfig = {
    rules: {
        "arrow-body-style": ["error", "always"],
        complexity: ["error", { max: 12 }],
        curly: ["error", "all"],
        "quality/no-conditional-empty-object-spread": "error",
        "quality/no-shape-in-symbol-names": "error",
        "quality/padding-line-between-statements": "error",
    },
};
const recommendedConfig = {
    categories: { correctness: "error" },
    options: { reportUnusedDisableDirectives: "error" },
    plugins: ["typescript", "unicorn", "oxc", "import", "promise", "node"],
    rules: {
        "no-debugger": "error",
        "no-unmodified-loop-condition": "error",
        "no-unsafe-optional-chaining": "error",
        "no-unused-vars": [
            "error",
            {
                fix: { imports: "off" },
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
            },
        ],
    },
};
const typeSafetyConfig = {
    plugins: ["typescript"],
    rules: {
        "quality/no-chained-type-assertions": "error",
        "quality/no-known-value-widening": "error",
        "quality/no-object-parameters": "error",
        "quality/no-unknown-parameters": "error",
        "quality/no-unknown-returns": "error",
        "quality/no-unknown-type-aliases": "error",
        "quality/no-unsafe-dictionary-type": "error",
        "quality/no-widen-then-assert": "error",
        "quality/require-safety-comment-for-type-assertion": "error",
        "typescript/consistent-type-definitions": ["error", "type"],
        "typescript/no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "typescript/prefer-as-const": "error",
    },
};
const typeAwareConfig = {
    options: { typeAware: true },
    plugins: ["typescript"],
    rules: {
        "typescript/no-explicit-any": "error",
        "typescript/no-unsafe-argument": "error",
        "typescript/no-unsafe-assignment": "error",
        "typescript/no-unsafe-call": "error",
        "typescript/no-unsafe-member-access": "error",
        "typescript/no-unsafe-return": "error",
        "typescript/prefer-readonly-parameter-types": "off",
    },
};
const boundariesConfig = {
    rules: {
        "quality/no-generic-record-guard": "error",
        "quality/no-reflect-apply": "error",
        "quality/no-reflect-get": "error",
        "quality/no-runtime-typeof": "error",
        "quality/no-unjustified-type-predicate": "error",
    },
};
const testingConfig = {
    rules: { "quality/no-module-mocking": "error" },
};
const architectureConfig = {
    rules: { "quality/no-exported-types": "error" },
};
const reactNextConfig = {
    plugins: ["react", "jsx-a11y", "nextjs"],
    rules: {
        "jsx-a11y/control-has-associated-label": "off",
        "jsx-a11y/heading-has-content": "off",
        "jsx-a11y/no-autofocus": "error",
        "jsx-a11y/no-static-element-interactions": "error",
        "jsx-a11y/prefer-tag-over-role": "off",
        "nextjs/no-html-link-for-pages": "error",
        "react-hooks/exhaustive-deps": "error",
        "react/iframe-missing-sandbox": "error",
        "react/jsx-no-constructed-context-values": "off",
        "react/no-array-index-key": "error",
        "react/no-unescaped-entities": "error",
        "react/react-in-jsx-scope": "off",
    },
    overrides: [
        {
            files: ["**/opengraph-image.tsx"],
            rules: {
                "nextjs/no-img-element": "off",
                "require-await": "off",
            },
        },
    ],
    settings: {
        next: { rootDir: "." },
        react: { version: "19.2.0" },
    },
};
const strictConfig = {
    categories: {
        correctness: "error",
        suspicious: "error",
        perf: "error",
        pedantic: "error",
    },
    rules: {
        "import/max-dependencies": "off",
        "import/namespace": "off",
        "import/no-named-as-default": "off",
        "import/no-named-as-default-member": "off",
        "import/no-unassigned-import": "off",
        "max-lines": "off",
        "max-lines-per-function": "off",
        "no-await-in-loop": "off",
        "no-inline-comments": "off",
        "no-shadow": "off",
        "no-underscore-dangle": "off",
        "promise/always-return": "off",
        "quality/extensionless-relative-code-imports": "error",
        "quality/no-type-assertions": "error",
        "quality/require-safety-comment-for-type-assertion": "off",
        "unicorn/consistent-function-scoping": "off",
        "unicorn/no-array-callback-reference": "off",
        "unicorn/no-new-array": "off",
        "unicorn/prefer-add-event-listener": "off",
        "unicorn/require-post-message-target-origin": "off",
    },
};
const effectLocalConfig = {
    plugins: ["import", "node", "promise", "vitest"],
    rules: {
        // Core requires explicit arrow bodies; do not recommend the opposite style.
        "effecttsgo/unnecessary-arrow-block": "off",
        "import/no-cycle": "error",
        "import/no-namespace": "error",
        "oxc/no-map-spread": ["error", { ignoreArgs: false }],
        "unicorn/no-array-callback-reference": "off",
    },
};
const staticPresets = {
    architecture: architectureConfig,
    boundaries: boundariesConfig,
    core: coreConfig,
    "react-next": reactNextConfig,
    recommended: mergeConfigFragments([coreConfig, recommendedConfig]),
    strict: strictConfig,
    testing: testingConfig,
    "type-aware": typeAwareConfig,
    "type-safety": typeSafetyConfig,
};
const allPresetNames = [
    "recommended",
    "type-safety",
    "type-aware",
    "boundaries",
    "testing",
    "architecture",
    "react-next",
    "effect",
    "strict",
];
function pluginKey(plugin) {
    return typeof plugin === "string"
        ? `specifier:${plugin}`
        : `alias:${plugin.name}:${plugin.specifier}`;
}
function uniquePlugins(plugins) {
    const seen = new Set();
    return plugins.filter((plugin) => {
        const key = pluginKey(plugin);
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
function mergeConfigFragments(fragments) {
    const plugins = [...new Set(fragments.flatMap((config) => config.plugins ?? []))];
    const jsPlugins = uniquePlugins(fragments.flatMap((config) => config.jsPlugins ?? []));
    const extendsConfigs = fragments.flatMap((config) => config.extends ?? []);
    const ignorePatterns = [
        ...new Set(fragments.flatMap((config) => config.ignorePatterns ?? [])),
    ];
    const overrides = fragments.flatMap((config) => config.overrides ?? []);
    return {
        categories: Object.assign({}, ...fragments.map((config) => config.categories ?? {})),
        env: Object.assign({}, ...fragments.map((config) => config.env ?? {})),
        extends: extendsConfigs,
        globals: Object.assign({}, ...fragments.map((config) => config.globals ?? {})),
        ignorePatterns,
        jsPlugins,
        options: Object.assign({}, ...fragments.map((config) => config.options ?? {})),
        overrides,
        plugins,
        rules: Object.assign({}, ...fragments.map((config) => config.rules ?? {})),
        settings: Object.assign({}, ...fragments.map((config) => config.settings ?? {})),
    };
}
function effectPreset() {
    const require = createRequire(import.meta.url);
    // SAFETY: The optional peer exports these preset values as OxlintConfig objects.
    const effectPresets = require("@effect/tsgo/oxlint-presets");
    return mergeConfigFragments([
        typeAwareConfig,
        // Keep Effect's recommended severities authoritative for its overlapping rules.
        effectPresets.correctness,
        effectPresets.recommended,
        effectPresets.antipattern,
        effectPresets.effectNative,
        effectPresets.style,
        effectLocalConfig,
    ]);
}
function expandPresetNames(names) {
    return names.includes("all")
        ? allPresetNames
        : names.filter((name) => name !== "all");
}
function configForPreset(name) {
    return name === "effect" ? effectPreset() : staticPresets[name];
}
/** Compose quality policy presets with repository-local Oxlint configuration. */
export function defineConfig(config = {}) {
    const { presets = ["all"], ...localConfig } = config;
    const selectedConfigs = expandPresetNames(presets).map(configForPreset);
    return mergeConfigFragments([
        { jsPlugins: [qualityPlugin] },
        ...selectedConfigs,
        localConfig,
    ]);
}
export const presetNames = [
    "recommended",
    "core",
    "type-safety",
    "type-aware",
    "boundaries",
    "testing",
    "architecture",
    "react-next",
    "effect",
    "strict",
    "all",
];
//# sourceMappingURL=index.js.map