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
 * Verifies whether a file is trusted.
 */
declare function verifyTrust(filePath: string): Promise<TrustResult>;
/**
 * Retrieves certificate details of a signed file.
 */
declare function getCertificate(filePath: string): Promise<CertificateInfo>;
/**
 * Checks if a file is signed by the expected signer.
 */
declare function isSigned(filePath: string, name?: string | null): Promise<boolean>;
export { verifyTrust, getCertificate, isSigned };
