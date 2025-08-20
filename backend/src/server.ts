import { createApp } from './app';
import { config } from './config';

const startServer = async (): Promise<void> => {
    try {
        const app = createApp();
        const server = app.listen(config.port, () => {
            console.log(`🚀 Server is running on port ${config.port}`);
        });

        const gracefulShutdown = (signal: string) => {
            console.log(`Received ${signal}. Initiating graceful shutdown...`);
            server.close((err) => {
                if (err) {
                    console.error('Error during server shutdown:', err);
                    process.exit(1);
                }
                console.log('✅ Server shut down gracefully');
                process.exit(0);
            });

            setTimeout(() => {
                console.error('Forcing server shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        ['SIGTERM', 'SIGINT'].forEach((signal) => {
            process.on(signal, () => gracefulShutdown(signal));
        });

        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

export { startServer };
