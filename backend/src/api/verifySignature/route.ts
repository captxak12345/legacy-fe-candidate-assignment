import { Router } from 'express';
import { VerifySignatureController } from './controller';
import { validateVerifySignatureRequest } from '../../core/middlewares';

const router = Router();

router.get('/', VerifySignatureController.getVerificationInfo);
router.post(
    '/', 
    validateVerifySignatureRequest, 
    VerifySignatureController.verifySignature
);

export default router;
