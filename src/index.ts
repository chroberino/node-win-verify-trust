/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import * as path from "node:path";
import { access } from "fs/promises";
import { constants } from "fs";
import { verifySignature, certificateInfo } from "./bindings"; // ✅ Import from bindings.ts

// Ensure Windows environment
if (process.platform !== "win32") {
  throw new Error("This package only works on Windows.");
}

// Type definitions
interface CertificateInfo {
  info?: {
    programName?: string;
    publisherLink?: string;
    infoLink?: string;
  };
  signer: {
    issuer?: string;
    subject?: string;
    serialNumber?: string;
    digestAlgo?: string;
  };
  timestamp?: {
    issuer?: string;
    subject?: string;
    serialNumber?: string;
    digestAlgo?: string;
  };
}

interface TrustResult {
  trusted: boolean;
  message: string;
}

/**
 * Checks if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures that the file is a valid signed file type and exists.
 */
async function shouldValidFile(filePath: string): Promise<void> {
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
async function verifyTrust(filePath: string): Promise<TrustResult> {
  await shouldValidFile(filePath);

  const failsafe = Date.now() + 1500;
  const result: TrustResult = { trusted: false, message: "" };
  let error: string;
  let outatime = false; // ✅ Initialize outatime

  do {
    const status = verifySignature(path.resolve(filePath));
    if (status === 0) {
      result.trusted = true;
      result.message = "The file is signed and the signature was verified";
      error = "ERROR_SUCCESS";
    } else {
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

/**
 * Retrieves certificate details of a signed file.
 */
async function getCertificate(filePath: string): Promise<CertificateInfo> {
  await shouldValidFile(filePath);

  const failsafe = Date.now() + 1500;
  let error: string;
  let outatime = false; // ✅ Initialize outatime

  let certificate: CertificateInfo = {
    signer: {
      issuer: "",
      subject: "",
      serialNumber: "",
      digestAlgo: ""
    }
  };

  do {
    const result = certificateInfo(path.resolve(filePath), certificate);
    if (result !== 0) {
      error = "CRYPT_E_NO_MATCH"; // Simulated error handling
    } else {
      error = "ERROR_SUCCESS";
    }
  } while (error === "CRYPT_E_NO_MATCH" && (outatime = Date.now() >= failsafe) === false);

  if (error === "CRYPT_E_NO_MATCH" && outatime) {
    throw new Error("Couldn't get any certificate information in time (timeout).");
  }

  return certificate;
}

/**
 * Checks if a file is signed by the expected signer.
 */
async function isSigned(filePath: string, name: string | null = null): Promise<boolean> {
  try {
    const { trusted } = await verifyTrust(filePath);
    if (typeof name === "string" && name.trim() !== "" && trusted) {
      const { signer } = await getCertificate(filePath);
      return signer.subject?.toLowerCase() === name.toLowerCase();
    }
    return trusted;
  } catch {
    return false;
  }
}

// Export functions
export { verifyTrust, getCertificate, isSigned };
