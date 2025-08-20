import { Request, Response, NextFunction } from 'express';
import { VerifySignatureRequest } from '@/api/verifySignature/types';

const sendErrorResponse = (
    res: Response,
    message: string,
    originalMessage: string | null = null
): void => {
    res.status(400).json({
        isValid: false,
        signer: null,
        originalMessage,
        error: message
    });
};

export const validateVerifySignatureRequest = (
    req: Request, 
    res: Response, 
    next: NextFunction
): void => {
    const { message, signature }: Partial<VerifySignatureRequest> = req.body;
    const errors: string[] = [];

    if (!message || typeof message !== 'string')
        errors.push('Message is required and must be a string');
    else {
        if (message.length === 0)
            errors.push('Message cannot be empty');
        else if (message.length > 1000)
            errors.push('Message too long (max 1000 characters)');
    }

    if (!signature || typeof signature !== 'string')
        errors.push('Signature is required and must be a string');
    else if (signature.length === 0)
        errors.push('Signature cannot be empty');

    if (errors.length > 0)
        return sendErrorResponse(res, errors.join('; '), message || null);

    next();
};

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
};

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    
    next();
};
