export interface VerifySignatureRequest {
    message: string;
    signature: string;
}

export interface VerifySignatureResponse {
    isValid: boolean;
    signer: string | null;
    originalMessage: string;
    error?: string;
}

export interface SignatureVerificationResult {
    isValid: boolean;
    signer: string | null;
    error?: string;
}
