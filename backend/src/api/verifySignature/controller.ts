import { Request, Response } from 'express';
import { SignatureVerificationService } from './service';
import { VerifySignatureRequest, VerifySignatureResponse } from './types';

export class VerifySignatureController {
    public static async verifySignature(req: Request, res: Response): Promise<void> {
        try {
            const { message, signature }: VerifySignatureRequest = req.body;
            const validationError = VerifySignatureController.validateRequest(message, signature);
            if (validationError) {
                return VerifySignatureController.sendErrorResponse(
                    res, 
                    400, 
                    validationError, 
                    message || ''
                );
            }

            const verificationResult = await SignatureVerificationService.verifySignature(
                message, 
                signature
            );
            if (!verificationResult.isValid) {
                return VerifySignatureController.sendErrorResponse(
                    res,
                    400,
                    verificationResult.error || 'Signature verification failed',
                    message
                );
            }
            VerifySignatureController.sendSuccessResponse(res, verificationResult.signer!, message);
        } catch (error) {
            VerifySignatureController.sendErrorResponse(
                res, 
                500, 
                'Internal server error during signature verification', 
                req.body?.message || ''
            );
        }
    }

    public static async getVerificationInfo(req: Request, res: Response): Promise<void> {
        const apiInfo = {
            message: 'Signature Verification API',
            version: '1.0.0',
            status: 'active',
            endpoints: {
                'POST /api/verify-signature': 'Verify a message signature and recover signer address',
                'GET /api/verify-signature': 'Get API documentation and usage information'
            },
            usage: {
                method: 'POST',
                contentType: 'application/json',
                body: {
                    message: 'string - The original message that was signed (max 1000 chars)',
                    signature: 'string - The signature to verify (0x prefixed hex, 132 chars)'
                },
                response: {
                    success: {
                        isValid: 'true',
                        signer: 'string - The recovered signer address (0x...)',
                        originalMessage: 'string - The original message'
                    },
                    error: {
                        isValid: 'false',
                        signer: 'null',
                        originalMessage: 'string - The original message',
                        error: 'string - Error description'
                    }
                }
            },
        };

        res.json(apiInfo);
    }

    private static validateRequest(message: string, signature: string): string | null {
        if (!message || !signature)
            return 'Message and signature are required';

        if (typeof message !== 'string')
            return 'Message must be a string';

        if (message.trim().length === 0)
            return 'Message cannot be empty';

        return null;
    }

    private static sendSuccessResponse(
        res: Response, 
        signer: string, 
        originalMessage: string
    ): void {
        const response: VerifySignatureResponse = {
            isValid: true,
            signer,
            originalMessage
        };
        res.status(200).json(response);
    }

    private static sendErrorResponse(
        res: Response, 
        statusCode: number, 
        errorMessage: string, 
        originalMessage: string = ''
    ): void {
        const response: VerifySignatureResponse = {
            isValid: false,
            signer: null,
            originalMessage,
            error: errorMessage
        };
        res.status(statusCode).json(response);
    }
}
