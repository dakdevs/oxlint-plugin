import process from "node:process";
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isGlibcRuntime() {
    if (process.platform !== "linux")
        return false;
    const report = process.report?.getReport();
    if (!isRecord(report) || !isRecord(report.header))
        return false;
    return typeof report.header.glibcVersionRuntime === "string";
}
export function currentEffectOxlintTarget() {
    return {
        architecture: process.arch,
        glibc: isGlibcRuntime(),
        platform: process.platform,
    };
}
export function effectOxlintSupportError(target) {
    if (target.architecture !== "x64" && target.architecture !== "arm64") {
        return `Unsupported architecture ${target.architecture}.`;
    }
    if (target.platform === "linux" && !target.glibc) {
        return "Linux musl is not supported by the packaged Oxlint integration.";
    }
    if (target.platform !== "linux" &&
        target.platform !== "darwin" &&
        target.platform !== "win32") {
        return `Unsupported platform ${target.platform}.`;
    }
    return null;
}
//# sourceMappingURL=effect-platform.js.map