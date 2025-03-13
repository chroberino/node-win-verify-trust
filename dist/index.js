"use strict";
/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSigned = exports.getCertificate = exports.verifyTrust = void 0;
const path = __importStar(require("node:path"));
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const bindings_1 = require("./bindings"); // ✅ Import from bindings.ts
// Ensure Windows environment
if (process.platform !== "win32") {
    throw new Error("This package only works on Windows.");
}
/**
 * Checks if a file exists.
 */
async function fileExists(filePath) {
    try {
        await (0, promises_1.access)(filePath, fs_1.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Ensures that the file is a valid signed file type and exists.
 */
async function shouldValidFile(filePath) {
    if (typeof filePath !== "string" || filePath.trim() === "") {
        throw new Error("Invalid file path.");
    }
    const allowedExtensions = [".exe", ".cab", ".dll", ".ocx", ".msi", ".msix", ".xpi", ".ps1"];
    if (!allowedExtensions.includes(path.extname(filePath))) {
        throw new Error(`Accepted file types are: ${allowedExtensions.join(",")}`);
    }
    if (!(await fileExists(filePath))) {
        throw new Error(`No such file: ${filePath}`);
    }
}
/**
 * Verifies whether a file is trusted.
 */
async function verifyTrust(filePath) {
    await shouldValidFile(filePath);
    const failsafe = Date.now() + 1500;
    const result = { trusted: false, message: "" };
    let error;
    let outatime = false; // ✅ Initialize outatime
    do {
        const status = (0, bindings_1.verifySignature)(path.resolve(filePath));
        if (status === 0) {
            result.trusted = true;
            result.message = "The file is signed and the signature was verified";
            error = "ERROR_SUCCESS";
        }
        else {
            error = "CRYPT_E_FILE_ERROR"; // Simulated error handling
            result.trusted = false;
            result.message = "Signature verification failed";
        }
    } while (error === "CRYPT_E_FILE_ERROR" && (outatime = Date.now() >= failsafe) === false);
    if (error === "CRYPT_E_FILE_ERROR" && outatime) {
        throw new Error("Couldn't verify trust information in time (timeout).");
    }
    return result;
}
exports.verifyTrust = verifyTrust;
/**
 * Retrieves certificate details of a signed file.
 */
async function getCertificate(filePath) {
    await shouldValidFile(filePath);
    const failsafe = Date.now() + 1500;
    let error;
    let outatime = false; // ✅ Initialize outatime
    let certificate = {
        signer: {
            issuer: "",
            subject: "",
            serialNumber: "",
            digestAlgo: ""
        }
    };
    do {
        const result = (0, bindings_1.certificateInfo)(path.resolve(filePath), certificate);
        if (result !== 0) {
            error = "CRYPT_E_NO_MATCH"; // Simulated error handling
        }
        else {
            error = "ERROR_SUCCESS";
        }
    } while (error === "CRYPT_E_NO_MATCH" && (outatime = Date.now() >= failsafe) === false);
    if (error === "CRYPT_E_NO_MATCH" && outatime) {
        throw new Error("Couldn't get any certificate information in time (timeout).");
    }
    return certificate;
}
exports.getCertificate = getCertificate;
/**
 * Checks if a file is signed by the expected signer.
 */
async function isSigned(filePath, name = null) {
    try {
        const { trusted } = await verifyTrust(filePath);
        if (typeof name === "string" && name.trim() !== "" && trusted) {
            const { signer } = await getCertificate(filePath);
            return signer.subject?.toLowerCase() === name.toLowerCase();
        }
        return trusted;
    }
    catch {
        return false;
    }
}
exports.isSigned = isSigned;
//# sourceMappingURL=index.js.map