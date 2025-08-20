import { ethers } from 'ethers';

export const recoverSigner = (message: string, signature: string): string => {
    return ethers.verifyMessage(message, signature);
};

export const isValidEthereumAddress = (address: string): boolean => {
    return ethers.isAddress(address);
};

export const isValidSignatureFormat = (signature: string): boolean => {
    try {
        const cleanSignature = signature.replace(/^0x/, '');
        return cleanSignature.length === 130 && /^[0-9a-fA-F]+$/.test(cleanSignature);
    } catch {
        return false;
    }
};
