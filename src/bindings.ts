import * as path from "path";

// Resolve the built `.node` file dynamically
const nativeAddonPath = path.join(__dirname, "../build/Release/winVerifyTrust.node");

// Load the compiled binary
const nativeAddon = require(nativeAddonPath);

export const verifySignature = nativeAddon.verifySignature;
export const certificateInfo = nativeAddon.certificateInfo;
