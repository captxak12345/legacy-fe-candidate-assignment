import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: '/api',
    
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: process.env.CORS_CREDENTIALS === 'true',
        optionsSuccessStatus: 200,
    },
    
    healthCheck: {
        enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
        endpoint: '/health',
    }
};


export const validateConfig = (): void => {
    const errors: string[] = [];

    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(config.nodeEnv))
        errors.push('Invalid NODE_ENV value');
    
    if (errors.length > 0) {
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
};

try {
    validateConfig();
} catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
}
