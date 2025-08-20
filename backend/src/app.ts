import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './core/middlewares';
import verifySignatureRoutes from './api/verifySignature/route';

export const createApp = () => {
    const app = express();
    configureApp(app);
    registerRoutes(app);
    handleUndefinedRoutes(app);
    app.use(errorHandler);
    return app;
};

const configureApp = (app: express.Application): void => {
    app.set('trust proxy', 1);
    app.use(cors(config.cors));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
};

const registerRoutes = (app: express.Application): void => {
    if (config.healthCheck.enabled)
        app.get(config.healthCheck.endpoint, healthCheckHandler);

    app.get('/', rootEndpointHandler);
    app.use(`${config.apiPrefix}/verify-signature`, verifySignatureRoutes);
};

const healthCheckHandler = (req: express.Request, res: express.Response): void => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
};

const rootEndpointHandler = (req: express.Request, res: express.Response): void => {
    res.json({
        message: 'Signature Verification API',
        documentation: {
            'POST /api/verify-signature': 'Verify a message signature and recover signer address',
            'GET /api/verify-signature': 'Get API documentation',
            'GET /health': 'Health check endpoint',
        },
    });
};

const handleUndefinedRoutes = (app: express.Application): void => {
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `The requested endpoint ${req.method} ${req.originalUrl} was not found`,
    });
  });
};

