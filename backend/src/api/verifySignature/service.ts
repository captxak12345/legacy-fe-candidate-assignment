import { ethers } from 'ethers';
import { SignatureVerificationResult } from './types';

export class SignatureVerificationService {
    public static async verifySignature(
        message: string, 
        signature: string
    ): Promise<SignatureVerificationResult> {
        if (!message || !signature) {
            return {
                isValid: false,
                signer: null,
                error: 'Message and signature are required',
            };
        }

        try {
            const recoveredSigner = ethers.verifyMessage(message, signature);

            if (!ethers.isAddress(recoveredSigner)) {
                return {
                    isValid: false,
                    signer: null,
                    error: 'Invalid signer address recovered',
                };
            }

            return {
                isValid: true,
                signer: recoveredSigner,
            };
        } catch (error) {
            console.error('Signature verification failed:', error);
            return {
                isValid: false,
                signer: null,
                error: 'Invalid signature format or verification failed',
            };
        }
    }

    public static isValidEthereumAddress(address: string): boolean {
        return ethers.isAddress(address);
    }
}
